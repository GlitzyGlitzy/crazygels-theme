export type Maybe<T> = T | null;

export type Connection<T> = {
  edges: Array<Edge<T>>;
  pageInfo: PageInfo;
};

export type Edge<T> = {
  node: T;
  cursor: string;
};

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: Connection<CartItem>;
  totalQuantity: number;
};

export type CartItem = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: {
      name: string;
      value: string;
    }[];
    product: Product;
  };
};

export type Collection = {
  handle: string;
  title: string;
  description: string;
  seo: SEO;
  updatedAt: string;
  image?: Image;
  products?: Connection<Product>;
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type Menu = {
  title: string;
  path: string;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Page = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo?: SEO;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  variants: Connection<ProductVariant>;
  featuredImage: Image;
  images: Connection<Image>;
  seo: SEO;
  tags: string[];
  updatedAt: string;
  vendor: string;
  productType: string;
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: Money;
  compareAtPrice?: Money;
  image?: Image;
};

export type SEO = {
  title: string;
  description: string;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: Connection<ShopifyCartItem>;
  totalQuantity: number;
};

export type ShopifyCartItem = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: {
      name: string;
      value: string;
    }[];
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: Image;
    };
  };
};

export type ShopifyCollection = {
  handle: string;
  title: string;
  description: string;
  seo: SEO;
  updatedAt: string;
  image?: Image;
  products?: Connection<ShopifyProduct>;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  variants: Connection<ProductVariant>;
  featuredImage: Image;
  images: Connection<Image>;
  seo: SEO;
  tags: string[];
  updatedAt: string;
  vendor: string;
  productType: string;
};

export type ShopifyProductOperation = {
  data: {
    product: ShopifyProduct;
  };
  variables: {
    handle: string;
  };
};

export type ShopifyProductsOperation = {
  data: {
    products: Connection<ShopifyProduct>;
  };
  variables: {
    query?: string;
    first?: number;
    sortKey?: string;
    reverse?: boolean;
  };
};

export type ShopifyCollectionOperation = {
  data: {
    collection: ShopifyCollection;
  };
  variables: {
    handle: string;
  };
};

export type ShopifyCollectionsOperation = {
  data: {
    collections: Connection<ShopifyCollection>;
  };
};

export type ShopifyCollectionProductsOperation = {
  data: {
    collection: {
      products: Connection<ShopifyProduct>;
    };
  };
  variables: {
    handle: string;
    first?: number;
    sortKey?: string;
    reverse?: boolean;
  };
};

// Blog Types
export type BlogArticle = {
  id: string;
  handle: string;
  title: string;
  content: string;
  contentHtml: string;
  excerpt: string;
  excerptHtml: string;
  publishedAt: string;
  author: {
    name: string;
    bio?: string;
  };
  image?: Image;
  tags: string[];
  seo: SEO;
  blog: {
    handle: string;
    title: string;
  };
};

export type Blog = {
  id: string;
  handle: string;
  title: string;
  seo: SEO;
  articles: Connection<BlogArticle>;
};

export type ShopifyBlog = Blog;
export type ShopifyBlogArticle = BlogArticle;

export type ShopifyBlogOperation = {
  data: {
    blog: ShopifyBlog | null;
  };
  variables: {
    handle: string;
  };
};

export type ShopifyBlogsOperation = {
  data: {
    blogs: Connection<ShopifyBlog>;
  };
};

export type ShopifyArticleOperation = {
  data: {
    blog: {
      articleByHandle: ShopifyBlogArticle | null;
    } | null;
  };
  variables: {
    blogHandle: string;
    articleHandle: string;
  };
};

export type ShopifyArticlesOperation = {
  data: {
    articles: Connection<ShopifyBlogArticle>;
  };
  variables: {
    first?: number;
    query?: string;
    sortKey?: string;
    reverse?: boolean;
  };
};
