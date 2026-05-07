// Stub de Firebase Auth para web/Expo Go
const auth = () => ({
  onAuthStateChanged: (cb) => { cb(null); return () => {}; },
});
auth.onAuthStateChanged = (cb) => { cb(null); return () => {}; };
export default auth;
