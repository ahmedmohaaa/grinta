import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  PlayCircle,
  Trophy
} from 'lucide-react';

import { Link, NavLink } from 'react-router-dom';

import gsap from 'gsap';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      gsap.from('.nav-item-anim', {
        y: -20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.3
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleScroll = () =>
      setIsScrolled(window.scrollY > 30);

    window.addEventListener('scroll', handleScroll);

    return () =>
      window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      className={`navbar ${isScrolled ? 'scrolled' : ''}`}
    >
      <div className="nav-container">

        {/* Logo */}
        <Link
          to="/"
          className="nav-brand nav-item-anim"
        >
          <div className="nav-logo-icon">
            G
          </div>

          <span className="nav-logo-text">
            Grinta
          </span>
        </Link>

        {/* Desktop */}
        <div className="nav-links">

          <CustomLink to="/" title="الرئيسية" />

          <CustomLink
            to="/matches"
            title="المباريات"
          />



          <CustomLink
            to="/news"
            title="الأخبار"
          />

          <CustomLink
            to="/videos"
            title="الفيديوهات"
            icon={<PlayCircle size={16} />}
          />

          {/* Dropdown */}
          <div className="dropdown-wrapper nav-item-anim">

            <div className="dropdown-trigger">
              <Trophy size={16} />

              <span>
                البطولات والبيانات
              </span>

              <ChevronDown size={14} />
            </div>

            <div className="dropdown-menu">

              <DropdownLink
                to="/leagues"
                title="الدوريات"
              />

              <DropdownLink
                to="/teams"
                title="الفرق"
              />

              <DropdownLink
                to="/players"
                title="اللاعبين"
              />

              <div className="dropdown-divider"></div>

              <DropdownLink
                to="/standings"
                title="جدول الترتيب"
              />

              <DropdownLink
                to="/stats"
                title="الإحصائيات"
              />

            </div>

          </div>

        </div>

        {/* Actions */}
        <div className="nav-actions">

          <button className="icon-btn">
            <Search size={22} />
          </button>

          <button
            className="icon-btn mobile-toggle"
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
          >
            {mobileMenuOpen
              ? <X size={28} />
              : <Menu size={28} />}
          </button>

        </div>

      </div>

      {/* Mobile */}
      {mobileMenuOpen && (
        <div className="mobile-menu">

          <MobileLink
            to="/"
            title="الرئيسية"
          />

          <MobileLink
            to="/matches"
            title="المباريات"
          />
                    <MobileLink
            to="/leagues"
            title="الدوريات"
          />

          <MobileLink
            to="/videos"
            title="نتائج مباشرة"
          />

          <MobileLink
            to="/news"
            title="الأخبار"
          />

          <MobileLink
            to="/stats"
            title="الاحصائيات"
          />

        </div>
      )}

    </nav>
  );
};

const CustomLink = ({
  to,
  title,
  icon
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `nav-link nav-item-anim ${
        isActive ? 'active' : ''
      }`
    }
  >
    {icon}
    {title}
  </NavLink>
);

const DropdownLink = ({
  to,
  title
}) => (
  <Link
    to={to}
    className="dropdown-item"
  >
    {title}
  </Link>
);

const MobileLink = ({
  to,
  title
}) => (
  <Link
    to={to}
    className="mobile-link"
  >
    {title}
  </Link>
);

export default Navbar;
