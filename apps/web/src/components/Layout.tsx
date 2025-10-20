import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-dvh">
      <nav className="border-b px-4 py-3 flex gap-3">
        <NavLink to="/" end className={({isActive})=> isActive ? 'font-semibold' : ''}>Home</NavLink>
        <NavLink to="/candidates" className={({isActive})=> isActive ? 'font-semibold' : ''}>Candidatos</NavLink>
        <NavLink to="/apply" className={({isActive})=> isActive ? 'font-semibold' : ''}>Postular</NavLink>
      </nav>
      <main className="max-w-5xl mx-auto p-4">
        {/* ¡CLAVE! Sin <Outlet />, nunca se renderizan las rutas hijas */}
        <Outlet />
      </main>
    </div>
  );
}
