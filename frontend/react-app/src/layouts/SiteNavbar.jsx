import { Bell, Menu, Moon, Shield, Sun, UserRound, X } from "lucide-react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link } from "react-router";

import logo from "@/assets/logo.svg";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore, useSession } from "@/store/authStore";

export function SiteNavbar({ onMenuClick, sidebarOpen }) {
  const { mode, toggle } = useTheme();
  const { user, isAdmin } = useSession();
  const logout = useAuthStore((s) => s.logout);
  const [expanded, setExpanded] = useState(false);
  const close = () => setExpanded(false);

  return (
    <Navbar expand="lg" sticky="top" className="navbar-agri border-bottom" expanded={expanded} onToggle={setExpanded}>
      <Container fluid className="navbar-inner">
        <Button variant="link" className="text-body p-2 side-menu-trigger" onClick={onMenuClick} aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={sidebarOpen} aria-controls="app-sidebar">{sidebarOpen ? <X size={22}/> : <Menu size={22}/>}</Button>
        <Navbar.Brand as={Link} to="/" onClick={close} className="d-flex align-items-center gap-2 fw-semibold">
          <img src={logo} alt="" width="42" height="42" className="brand-mark" />
          <span className="brand-wordmark" aria-label="AgriSmart — Precision farming for a better tomorrow"><span><b>Agri</b><b>Smart</b></span><small>Precision farming for a better tomorrow</small></span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <div className="d-flex align-items-center justify-content-end gap-2 ms-auto">
            <Button variant="link" className="text-body p-1" aria-label="Notifications" title="No new notifications"><Bell size={18}/></Button>
            <select className="language-select" aria-label="Language" defaultValue="en" onChange={e=>document.documentElement.lang=e.target.value}><option value="en">EN</option><option value="hi">&#2361;&#2367;&#2306;&#2342;&#2368;</option></select>
            {user ? (
              <>
                <NavDropdown title={<><UserRound size={16}/> {user.full_name || "Account"}</>} align="end"><NavDropdown.Item as={Link} to="/farms" onClick={close}>My farms</NavDropdown.Item><NavDropdown.Item onClick={logout}>Sign out</NavDropdown.Item></NavDropdown>
              </>
            ) : (
              <><Button as={Link} to="/login" variant="outline-primary" size="sm" onClick={close}>Sign in</Button><Button as={Link} to="/register" variant="primary" size="sm" onClick={close}>Join</Button></>
            )}
            {isAdmin && <NavDropdown title={<><Shield size={15}/> Admin</>} id="admin-menu" align="end"><NavDropdown.Item as={Link} to="/admin">Admin tools</NavDropdown.Item></NavDropdown>}
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
