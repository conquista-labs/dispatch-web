import { useSessionStore } from '@/entities/usuario'
import { MinhaFilaBoard } from '@/widgets/minha-fila-board'

// RF-19 a RF-24.
export const MinhaFilaPage = () => {
  const usuario = useSessionStore((state) => state.usuario)

  return (
    <div className="px-7 pt-6 pb-7">
      <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Minha fila</h1>
      {usuario && <p className="mt-1.5 text-[13.5px] text-muted-foreground">{usuario.nome}</p>}

      <div className="mt-4">
        <MinhaFilaBoard />
      </div>
    </div>
  )
}
