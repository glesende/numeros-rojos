export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-xs">
          Los datos que todo socio de Independiente tiene que saber.
        </p>
        <p className="text-xs mt-4">
          Proyecto realizado en colaboración con:
        </p>
        <div className="mt-2">
          <a href="https://www.orgullorojo.com" target="_blank" rel="noopener noreferrer">
            <img src="/or-horizontal.png" alt="OrgulloRojo.com" className="h-10 mx-auto opacity-50 hover:opacity-80 transition-opacity" />
          </a>
        </div>
        <p className="text-xs mt-4 text-gray-600">
          Proyecto de datos abiertos. No oficial.
        </p>
      </div>
    </footer>
  );
}
