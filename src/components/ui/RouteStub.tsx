interface RouteStubProps {
  id: string;
  title: string;
  description: string;
}

/** Временная заглушка экрана — заменяется реальной реализацией на соответствующем этапе AGENT_BUILD_PLAN.md. */
export function RouteStub({ id, title, description }: RouteStubProps) {
  return (
    <div className="p-6">
      <span className="inline-block rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700">
        {id}
      </span>
      <h1 className="mt-3 text-xl font-bold text-navy-900">{title}</h1>
      <p className="mt-2 text-sm text-navy-500">{description}</p>
    </div>
  );
}
