"use client";

import { useEffect, useState } from "react";

type AgentFlowSummary = {
  request_id: string;
  tracking_id: string;
  departamento: string;
  estado: string;
  es_competencia_secretaria: boolean;
  motivo_no_competencia: string;
  detalle_competencia: string;
  sentimiento_label: string;
  sentimiento_score: number;
  tipo_peticion: string;
  dias_limite_ley_1755: number;
  fecha_limite_respuesta: string;
  requiere_humano: boolean;
  razon_revision: string;
  borrador_respuesta: string;
  fragmento_competente: string;
  fuera_competencia: string[];
  fuentes_gov_permitidas: string[];
  normativas_halladas: Array<{ source?: string; snippet?: string; url?: string }>;
};

function getBackendUrl(): string {
  const value = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "").trim().replace(/\/$/, "");
  if (!value) {
    throw new Error("NEXT_PUBLIC_BACKEND_BASE_URL no esta configurado.");
  }
  return value;
}

export default function AdminAgentesPage() {
  const [data, setData] = useState<AgentFlowSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLatest = async () => {
    setLoading(true);
    setError("");
    try {
      const baseUrl = getBackendUrl();
      const response = await fetch(`${baseUrl}/api/admin/agent-flow/latest`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "No fue posible consultar el borrador.");
      }
      const summary = (await response.json()) as AgentFlowSummary;
      setData(summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado al consultar el flujo.");
    } finally {
      setLoading(false);
    }
  };

  const runLatest = async () => {
    setLoading(true);
    setError("");
    try {
      const baseUrl = getBackendUrl();
      const response = await fetch(`${baseUrl}/api/admin/agent-flow/run-latest`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "No fue posible ejecutar el flujo.");
      }
      const body = (await response.json()) as { data: AgentFlowSummary };
      setData(body.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado al ejecutar agentes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLatest();
  }, []);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Admin de Agentes PQRS</h1>
      <p style={{ color: "#475569", marginBottom: "1.25rem" }}>
        Ejecuta el flujo mínimo sobre la PQRS más reciente y revisa el borrador institucional generado.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={runLatest}
          disabled={loading}
          style={{
            border: 0,
            borderRadius: 10,
            padding: "0.65rem 1rem",
            background: "#0f766e",
            color: "#fff",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Procesando..." : "Ejecutar agentes (última PQRS)"}
        </button>

        <button
          type="button"
          onClick={loadLatest}
          disabled={loading}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            padding: "0.65rem 1rem",
            background: "#fff",
            color: "#0f172a",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Refrescar
        </button>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "0.75rem 1rem", borderRadius: 10, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {data && (
        <section style={{ display: "grid", gap: "1rem" }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Resumen</h2>
            <p><strong>Tracking:</strong> {data.tracking_id}</p>
            <p><strong>Estado:</strong> {data.estado}</p>
            <p><strong>Departamento:</strong> {data.departamento}</p>
            <p><strong>Competencia Secretaría:</strong> {data.es_competencia_secretaria ? "Sí" : "No"}</p>
            {data.detalle_competencia && (
              <p><strong>Detalle competencia:</strong> {data.detalle_competencia}</p>
            )}
            {data.motivo_no_competencia && (
              <p><strong>Motivo no competencia:</strong> {data.motivo_no_competencia}</p>
            )}
            <p><strong>Tipo petición:</strong> {data.tipo_peticion}</p>
            <p><strong>Sentimiento:</strong> {data.sentimiento_label} ({data.sentimiento_score.toFixed(3)})</p>
            <p><strong>Días límite Ley 1755:</strong> {data.dias_limite_ley_1755}</p>
            <p><strong>Fecha límite:</strong> {data.fecha_limite_respuesta || "Sin calcular"}</p>
            <p><strong>Requiere humano:</strong> {data.requiere_humano ? "Sí" : "No"}</p>
            {data.razon_revision && <p><strong>Razón revisión:</strong> {data.razon_revision}</p>}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Fragmento competente (Desarrollo Económico)</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{data.fragmento_competente || "Sin fragmento"}</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Fuera de competencia</h2>
            {data.fuera_competencia.length === 0 ? (
              <p>No se detectaron fragmentos fuera de competencia.</p>
            ) : (
              <ul>
                {data.fuera_competencia.map((fragment, index) => (
                  <li key={`${fragment}-${index}`}>{fragment}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Normativas halladas</h2>
            {data.normativas_halladas.length === 0 ? (
              <p>Sin contexto legal recuperado.</p>
            ) : (
              <ul>
                {data.normativas_halladas.map((item, index) => (
                  <li key={`${item.source || "norma"}-${index}`}>
                    <strong>{item.source || "Fuente"}</strong>: {item.snippet || "Sin resumen"}
                    {item.url ? ` (${item.url})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Fuentes .gov.co permitidas</h2>
            <ul>
              {data.fuentes_gov_permitidas.map((url) => (
                <li key={url}>{url}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem" }}>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Borrador generado</h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {data.borrador_respuesta || "Sin borrador. Ejecuta el flujo."}
            </pre>
          </div>
        </section>
      )}
    </main>
  );
}
