export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Gym Management</h2>
      </div>
      <ul className="navbar-menu">
        <li><a href="/">Home</a></li>
        <li><a href="/login">Login</a></li>
      </ul>
    </nav>
  );
}
