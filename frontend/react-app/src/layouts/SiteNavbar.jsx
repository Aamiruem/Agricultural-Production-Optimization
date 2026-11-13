import { LogOut, Moon, Shield, Sun } from "lucide-react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link, NavLink } from "react-router";

import logo from "@/assets/logo.svg";
import { useTheme } from "@/context/ThemeContext";
import { useAuthStore, useSession } from "@/store/authStore";

const NAV = [
  { to: "/recommend", label: "Crop advisor" },
  { to: "/fertilizer", label: "Fertilizer" },
  { to: "/crops", label: "Crops" },
  { to: "/planner", label: "Planner" },
  { to: "/farms", label: "Farms" },
  { to: "/assistant", label: "Assistant" },
  { to: "/insights", label: "Insights" },
];

export function SiteNavbar() {
  const { mode, toggle } = useTheme();
  const { user, isAdmin } = useSession();
  const logout = useAuthStore((s) => s.logout);
  const [expanded, setExpanded] = useState(false);
  const close = () => setExpanded(false);

  return (
    <Navbar expand="lg" sticky="top" className="navbar-agri border-bottom" expanded={expanded} onToggle={setExpanded}>
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={close} className="d-flex align-items-center gap-2 fw-semibold">
          <img src={logo} alt="" width="24" height="24" className="text-primary" style={{ color: "var(--bs-primary)" }} />
          AgriOptima
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav as="nav" aria-label="Main" className="me-auto gap-lg-1">
            {NAV.map((item) => (
              <Nav.Link key={item.to} as={NavLink} to={item.to} onClick={close} className="px-lg-2">
                {item.label}
              </Nav.Link>
            ))}
            {isAdmin && (
              <Nav.Link as={NavLink} to="/admin" onClick={close} className="px-lg-2 d-flex align-items-center gap-1">
                <Shield size={14} aria-hidden /> Admin
              </Nav.Link>
            )}
          </Nav>
          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="small text-body-secondary text-truncate" style={{ maxWidth: "10rem" }} title={user.email}>
                  {user.full_name}
                </span>
                <Button variant="link" className="text-body p-1" onClick={logout} aria-label="Sign out">
                  <LogOut size={18} />
                </Button>
              </>
            ) : (
              <Button as={Link} to="/login" variant="outline-primary" size="sm" onClick={close}>
                Sign in
              </Button>
            )}
            <Button
              variant="link"
              className="text-body p-1"
              onClick={toggle}
              aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
