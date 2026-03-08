import { serialize } from 'cookie';

export default function handler(req, res) {
  // Clear the session cookie
  res.setHeader(
    'Set-Cookie',
    serialize('momentum_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    }),
  );

  res.redirect(302, '/login');
}
