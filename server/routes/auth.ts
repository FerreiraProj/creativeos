import { Router } from 'express';
import { verifyPassword } from '../auth.ts';

const router = Router();

router.post('/login', async (req, res) => {
  const { password } = req.body || {};
  const ok = await verifyPassword(typeof password === 'string' ? password : '');
  if (!ok) {
    res.status(401).json({ success: false, error: 'Incorrect password' });
    return;
  }
  req.session.authenticated = true;
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

export default router;
