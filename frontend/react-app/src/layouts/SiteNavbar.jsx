import { Bell, Moon, Shield, Sun, UserRound } from "lucide-react";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link, NavLink } from "react-router";

import logo from "@/assets/logo.svg";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore, useSession } from "@/store/authStore";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recommend", label: "Crop advisor" },
  { to: "/crops", label: "Crops" },
  { to: "/yield", label: "Yield" },
  { to: "/soil", label: "Soil" },
  { to: "/weather", label: "Weather" },
];
const MORE = [ ["/fertilizer","Fertilizer recommendation"],["/irrigation","Irrigation optimization"],["/disease","Disease detection"],["/reports","Reports"],["/planner","Planner"],["/farms","My farms"],["/assistant","Farm assistant"],["/insights","Model insights"],["/about","About us"],["/contact","Contact"] ];

export function SiteNavbar() {
  const { mode, toggle } = useTheme();
  const { user, isAdmin } = useSession();
  const logout = useAuthStore((s) => s.logout);
  const [expanded, setExpanded] = useState(false);
  const close = () => setExpanded(false);

  return (
    <Navbar expand="lg" sticky="top" className="navbar-agri border-bottom" expanded={expanded} onToggle={setExpanded}>
      <Container fluid className="navbar-inner">
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
            <NavDropdown title="More" id="more-nav" align="end">
              {MORE.map(([to,label])=><NavDropdown.Item key={to} as={NavLink} to={to} onClick={close}>{label}</NavDropdown.Item>)}
            </NavDropdown>
            {isAdmin && (
              <Nav.Link as={NavLink} to="/admin" onClick={close} className="px-lg-2 d-flex align-items-center gap-1">
                <Shield size={14} aria-hidden /> Admin
              </Nav.Link>
            )}
          </Nav>
          <div className="d-flex align-items-center gap-2">
            <Button variant="link" className="text-body p-1" aria-label="Notifications" title="No new notifications"><Bell size={18}/></Button>
            <select className="language-select" aria-label="Language" defaultValue="en" onChange={e=>document.documentElement.lang=e.target.value}><option value="en">EN</option><option value="hi">हिंदी</option></select>
            {user ? (
              <>
                <NavDropdown title={<><UserRound size={16}/> {user.full_name || "Account"}</>} align="end"><NavDropdown.Item as={Link} to="/farms" onClick={close}>My farms</NavDropdown.Item><NavDropdown.Item onClick={logout}>Sign out</NavDropdown.Item></NavDropdown>
              </>
            ) : (
              <><Button as={Link} to="/login" variant="outline-primary" size="sm" onClick={close}>Sign in</Button><Button as={Link} to="/register" variant="primary" size="sm" onClick={close}>Join</Button></>
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
