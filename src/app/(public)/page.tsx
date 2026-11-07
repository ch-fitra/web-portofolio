import type { Viewport } from "next";
import Home from "@/components/portfolio/home";
import About from "@/components/portfolio/about";
import Skills from "@/components/portfolio/skills";
import Projects from "@/components/portfolio/projects";
import Contact from "@/components/portfolio/contact";
import { PortfolioScroll } from "@/components/portfolio-scroll";
import { PortfolioGateway } from "@/components/portfolio-gateway";
export const viewport: Viewport = { interactiveWidget: "resizes-content" };
export default function Portfolio() {
  return (
    <PortfolioGateway>
      <PortfolioScroll>
        <section id="home" className="portfolio-section" aria-label="Home">
          <Home />
        </section>
        <section id="about" className="portfolio-section" aria-label="About">
          <About />
        </section>
        <section id="skills" className="portfolio-section" aria-label="Skills">
          <Skills />
        </section>
        <section
          id="projects"
          className="portfolio-section"
          aria-label="Projects"
        >
          <Projects />
        </section>
        <section
          id="contact"
          className="portfolio-section"
          aria-label="Contact"
        >
          <Contact />
        </section>
      </PortfolioScroll>
    </PortfolioGateway>
  );
}
