import { Link } from "react-router-dom";
import { GraduationCap, Twitter, Instagram, Youtube, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    plataforma: [
      { label: "Dashboard", href: "/app/dashboard" },
      { label: "Tutor Primaria", href: "/app/tutor-ia/primary" },
      { label: "Tutor Bachillerato", href: "/app/tutor-ia/highschool" },
      { label: "Flashcards", href: "/app/flashcards" },
    ],
    modulos: [
      { label: "Tutoría Inteligente", href: "/app/tutoria-inteligente" },
      { label: "Career Pathfinder", href: "/app/career-pathfinder" },
      { label: "Arena", href: "/app/arena" },
      { label: "Tienda Nova", href: "/app/tienda-nova" },
    ],
    soporte: [
      { label: "Centro de Ayuda", href: "#" },
      { label: "API", href: "#" },
      { label: "Documentación", href: "#" },
      { label: "Contacto", href: "/#contact" },
    ],
    legal: [
      { label: "Privacidad", href: "#" },
      { label: "Términos", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-primary">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-foreground">Nova Schola</span>
                <span className="text-gradient font-bold ml-1">AI</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
              La plataforma de educación virtual más avanzada en español. Aprende con IA usando el método socrático.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-2.5 rounded-lg bg-secondary hover:bg-primary/20 hover:text-primary transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="space-y-3">
              {footerLinks.plataforma.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              Módulos
            </h4>
            <ul className="space-y-3">
              {footerLinks.modulos.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              Soporte
            </h4>
            <ul className="space-y-3">
              {footerLinks.soporte.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Nova Schola AI Academy. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <a href="mailto:hola@novaschola.ai" className="hover:text-foreground transition-colors">
              hola@novaschola.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
