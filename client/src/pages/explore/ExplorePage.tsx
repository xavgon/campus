import { Link } from 'react-router-dom';
import { AuthPanel } from '@/shared/components/campus/AuthPanel';
import { Button } from '@/shared/components/ui/Button';

export const ExplorePage = () => (
  <AuthPanel
    title="Explorar podcasts"
    subtitle="Descobre episódios educativos publicados na plataforma. O catálogo completo chega com o Módulo 2."
    footerText="Queres publicar conteúdo?"
    footerHref="/register"
    footerLabel="Criar conta"
  >
    <div className="rounded-none border border-dashed border-campus-border/80 bg-black/20 p-6 text-center">
      <p className="text-sm text-campus-muted">Nenhum episódio listado ainda.</p>
      <Link to="/register" className="mt-4 inline-block">
        <Button variant="outline" fullWidth>
          Começar como criador
        </Button>
      </Link>
    </div>
  </AuthPanel>
);
