'use client';

export default function LogoutButton() {
  async function handleLogout() {
    localStorage.removeItem('cg_admin_token');
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-red-300 hover:text-red-600"
    >
      Sign out
    </button>
  );
}
