"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Menu,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white/20 backdrop-blur-xl shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1
                  className={`text-2xl font-bold transition-colors duration-300 ${
                    scrolled ? "text-green-900" : "text-white"
                  }`}
                >
                  AWG StockManager
                </h1>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className={`transition-colors duration-300 hover:text-green-600 ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
              >
                Recursos
              </a>
              <a
                href="#benefits"
                className={`transition-colors duration-300 hover:text-green-600 ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
              >
                Benefícios
              </a>
              <a
                href="#technology"
                className={`transition-colors duration-300 hover:text-green-600 ${
                  scrolled ? "text-gray-900" : "text-white"
                }`}
              >
                Tecnologia
              </a>
              <Link href="/login">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Entrar
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-md transition-colors duration-300 ${
                  scrolled
                    ? "text-gray-900 hover:bg-gray-100"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className={`md:hidden absolute top-16 left-0 right-0 transition-all duration-300 ${
                scrolled
                  ? "bg-white/95 backdrop-blur-xl border-b border-white/20"
                  : "bg-black/50 backdrop-blur-xl"
              }`}
            >
              <div className="px-4 py-6 space-y-4">
                <a
                  href="#features"
                  className={`block py-2 text-lg transition-colors duration-300 ${
                    scrolled
                      ? "text-gray-700 hover:text-green-600"
                      : "text-white hover:text-green-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Recursos
                </a>
                <a
                  href="#benefits"
                  className={`block py-2 text-lg transition-colors duration-300 ${
                    scrolled
                      ? "text-gray-700 hover:text-green-600"
                      : "text-white hover:text-green-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Benefícios
                </a>
                <a
                  href="#technology"
                  className={`block py-2 text-lg transition-colors duration-300 ${
                    scrolled
                      ? "text-gray-700 hover:text-green-600"
                      : "text-white hover:text-green-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tecnologia
                </a>
                <div className="pt-4">
                  <Link href="/login">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Entrar
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          className="absolute top-0 object-cover z-0 w-full h-full"
          poster="https://res.cloudinary.com/dgdvt1tgv/image/upload/v1757384473/heroawg_ktytox.png"
        >
          <source
            src="https://res.cloudinary.com/dgdvt1tgv/video/upload/v1757384237/13905670_1920_1080_60fps_p4o4fa.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-800/70 to-green-700/60" />

        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Gerencie seu
            <span className="block bg-gradient-to-r from-green-300 to-white bg-clip-text text-transparent">
              Agronegócio
            </span>
            com Inteligência
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-2xl mx-auto">
            Controle total do seu estoque agrícola com tecnologia de ponta.
            Otimize recursos, maximize lucros e tome decisões baseadas em dados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-green-600 hover:bg-white hover:text-green-800 px-8 py-4 text-lg"
            >
              Ver Demonstração
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-white" />
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-b from-white to-green-50 min-h-screen items-center flex"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos Poderosos para seu Agronegócio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubra como nossa plataforma pode revolucionar a gestão do seu
              estoque agrícola
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Dashboard Inteligente
              </h3>
              <p className="text-gray-600">
                Visualize métricas em tempo real e tome decisões baseadas em
                dados precisos
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Segurança Total
              </h3>
              <p className="text-gray-600">
                Seus dados protegidos com criptografia de nível empresarial
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Performance Rápida
              </h3>
              <p className="text-gray-600">
                Interface responsiva e carregamento instantâneo em qualquer
                dispositivo
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gestão de Equipe
              </h3>
              <p className="text-gray-600">
                Controle de acesso e permissões para toda sua equipe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="py-20 bg-gradient-to-r from-green-600 to-green-800 min-h-screen items-center flex"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Transforme sua Gestão Agrícola
              </h2>
              <p className="text-xl text-green-100 mb-8">
                Muitos produtores já confiam no AWG StockManager para
                otimizar suas operações agrícolas.
              </p>

              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3" />
                  <span className="text-white text-lg">
                    Redução de 40% no desperdício de insumos
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3" />
                  <span className="text-white text-lg">
                    Aumento de 25% na produtividade
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3" />
                  <span className="text-white text-lg">
                    Controle total de entradas e saídas
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3" />
                  <span className="text-white text-lg">
                    Relatórios detalhados em tempo real
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                width={500}
                height={500}
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Agricultura moderna"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section
        id="technology"
        className="py-20 bg-gradient-to-b from-gray-50 to-white min-h-screen items-center flex"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tecnologia de Ponta
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Construído com as melhores tecnologias para garantir performance,
              segurança e escalabilidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-white shadow-lg">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">⚛️</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                React & Next.js
              </h3>
              <p className="text-gray-600">
                Interface moderna e responsiva com renderização otimizada
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-white shadow-lg">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">🗄️</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Prisma & PostgreSQL
              </h3>
              <p className="text-gray-600">
                Banco de dados robusto e ORM type-safe para máxima
                confiabilidade
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-white shadow-lg">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">🔒</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                JWT & Bcrypt
              </h3>
              <p className="text-gray-600">
                Autenticação segura e criptografia de dados sensíveis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-900 min-h-screen items-center flex">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para Revolucionar seu Agronegócio?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Junte-se a todos os produtores que já transformaram sua gestão
            com o AWG StockManager
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-green-800 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Começar Agora - Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-green-600 hover:bg-white hover:text-green-800 px-8 py-4 text-lg"
            >
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">AWG StockManager</h3>
              <p className="text-gray-400">
                A solução completa para gestão de estoque no agronegócio.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Demonstração
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Carreiras
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{`© ${new Date().getFullYear()} AWG StockManager. Todos os direitos reservados.`}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
