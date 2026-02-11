# ---------------------------------------------------------------------------
# Lambda — data processing, aggregation, and export generation
# ---------------------------------------------------------------------------

resource "aws_security_group" "lambda" {
  name_prefix = "${var.project_name}-lambda-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-lambda-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM role for Lambda
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket",
        ]
        Resource = [
          aws_s3_bucket.raw_data.arn,
          "${aws_s3_bucket.raw_data.arn}/*",
          aws_s3_bucket.exports.arn,
          "${aws_s3_bucket.exports.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = [aws_secretsmanager_secret.db_credentials.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
        ]
        Resource = ["*"]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = ["arn:aws:logs:*:*:*"]
      },
    ]
  })
}

# Data processing Lambda (aggregates price history, generates insights)
resource "aws_lambda_function" "data_processor" {
  function_name = "${var.project_name}-data-processor"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.process"
  runtime       = "python3.11"
  timeout       = 300  # 5 minutes
  memory_size   = 512

  filename         = "${path.module}/../deployment/lambda/data_processor.zip"
  source_code_hash = filebase64sha256("${path.module}/../deployment/lambda/data_processor.zip")

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN  = aws_secretsmanager_secret.db_credentials.arn
      EXPORT_BUCKET  = aws_s3_bucket.exports.id
      RAW_BUCKET     = aws_s3_bucket.raw_data.id
    }
  }
}

# Export generator Lambda (creates CSV/JSON reports)
resource "aws_lambda_function" "export_generator" {
  function_name = "${var.project_name}-export-generator"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.export_data"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 256

  filename         = "${path.module}/../deployment/lambda/export_generator.zip"
  source_code_hash = filebase64sha256("${path.module}/../deployment/lambda/export_generator.zip")

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN  = aws_secretsmanager_secret.db_credentials.arn
      EXPORT_BUCKET  = aws_s3_bucket.exports.id
    }
  }
}

# S3 trigger: process new files as they arrive
resource "aws_s3_bucket_notification" "raw_data" {
  bucket = aws_s3_bucket.raw_data.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.data_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".json"
    filter_prefix        = "" # all sources
  }

  depends_on = [aws_lambda_permission.s3_trigger]
}

resource "aws_lambda_permission" "s3_trigger" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.raw_data.arn
}

# Catalog promoter Lambda (anonymised_products -> product_catalog)
resource "aws_lambda_function" "catalog_promoter" {
  function_name = "${var.project_name}-catalog-promoter"
  role          = aws_iam_role.lambda.arn
  handler       = "handler.promote"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 256

  filename         = "${path.module}/../deployment/lambda/catalog_promoter.zip"
  source_code_hash = filebase64sha256("${path.module}/../deployment/lambda/catalog_promoter.zip")

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN = aws_secretsmanager_secret.db_credentials.arn
    }
  }
}

# Schedule: run catalog promoter daily after data processing (09:00 UTC)
resource "aws_cloudwatch_event_rule" "daily_promotion" {
  name                = "${var.project_name}-daily-promotion"
  description         = "Promote scraped products to catalog daily"
  schedule_expression = "cron(0 9 * * ? *)"
}

resource "aws_cloudwatch_event_target" "catalog_promoter" {
  rule = aws_cloudwatch_event_rule.daily_promotion.name
  arn  = aws_lambda_function.catalog_promoter.arn
}

resource "aws_lambda_permission" "cloudwatch_catalog_promoter" {
  statement_id  = "AllowCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.catalog_promoter.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_promotion.arn
}

# Schedule: run data processor daily after scraping
resource "aws_cloudwatch_event_rule" "daily_processing" {
  name                = "${var.project_name}-daily-processing"
  description         = "Trigger data processing after daily scrape"
  schedule_expression = "cron(0 8 * * ? *)" # 08:00 UTC daily
}

resource "aws_cloudwatch_event_target" "data_processor" {
  rule = aws_cloudwatch_event_rule.daily_processing.name
  arn  = aws_lambda_function.data_processor.arn
}

resource "aws_lambda_permission" "cloudwatch_data_processor" {
  statement_id  = "AllowCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.data_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_processing.arn
}

# Weekly export generation
resource "aws_cloudwatch_event_rule" "weekly_export" {
  name                = "${var.project_name}-weekly-export"
  description         = "Generate weekly competitor analysis export"
  schedule_expression = "cron(0 10 ? * MON *)" # Monday 10:00 UTC
}

resource "aws_cloudwatch_event_target" "export_generator" {
  rule = aws_cloudwatch_event_rule.weekly_export.name
  arn  = aws_lambda_function.export_generator.arn
}

resource "aws_lambda_permission" "cloudwatch_export" {
  statement_id  = "AllowCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.export_generator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_export.arn
}
