'use client'

import Sidebar from "@/components/Sidebar";
import Toaster from "@/components/ui/toast";
import { useState, useEffect, useRef } from "react";
import type { ToasterRef } from "@/components/ui/toast";

// Criar uma instância global do toaster
let globalToasterRef: ToasterRef | null = null;

export const showToast = (props: Parameters<ToasterRef['show']>[0]) => {
  globalToasterRef?.show(props);
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'sidebar' | 'header' | 'footer' | 'right'>(() => {
    // Inicialização lazy - só roda uma vez no cliente
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('menuPosition');
      return (saved as 'sidebar' | 'header' | 'footer' | 'right') || 'sidebar';
    }
    return 'sidebar';
  });
  const toasterRef = useRef<ToasterRef>(null);

  useEffect(() => {
    globalToasterRef = toasterRef.current;
  }, []);

  // Escutar mudanças na posição do menu
  useEffect(() => {
    const handleMenuPositionChange = ((e: CustomEvent) => {
      setMenuPosition(e.detail.position);
    }) as EventListener;

    window.addEventListener('menu-position-changed', handleMenuPositionChange);
    return () => window.removeEventListener('menu-position-changed', handleMenuPositionChange);
  }, []);

  useEffect(() => {
    const handleCollapse = ((e: CustomEvent) => {
      setIsCollapsed(e.detail.isCollapsed);
    }) as EventListener;

    window.addEventListener('sidebar-collapse', handleCollapse);
    return () => window.removeEventListener('sidebar-collapse', handleCollapse);
  }, []);

  // Renderizar baseado na posição do menu
  if (menuPosition === 'header') {
    return (
      <>
        <Toaster ref={toasterRef} defaultPosition="top-right" />
        <div className="min-h-screen bg-[var(--color-bg-app)]">
          <div className="fixed top-0 left-0 right-0 z-50">
            <Sidebar position="header" />
          </div>
          <main className="pt-20 p-8">
            {children}
          </main>
        </div>
      </>
    );
  }

  if (menuPosition === 'footer') {
    return (
      <>
        <Toaster ref={toasterRef} defaultPosition="top-right" />
        <div className="min-h-screen bg-[var(--color-bg-app)]">
          <main className="pb-20 p-8">
            {children}
          </main>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <Sidebar position="footer" />
          </div>
        </div>
      </>
    );
  }

  if (menuPosition === 'right') {
    return (
      <>
        <Toaster ref={toasterRef} defaultPosition="top-right" />
        <Sidebar position="right" />
        <main className={`min-h-screen bg-[var(--color-bg-app)] p-8 transition-all duration-300 ${isCollapsed ? 'mr-20' : 'mr-64'}`}>
          {children}
        </main>
      </>
    );
  }

  // Padrão: sidebar lateral esquerda
  return (
    <>
      <Toaster ref={toasterRef} defaultPosition="top-right" />
      <Sidebar position="sidebar" />
      <main className={`min-h-screen bg-[var(--color-bg-app)] p-8 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </main>
    </>
  );
}
