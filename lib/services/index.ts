/** Barrel export — capa de servicios (lógica de negocio) */
export { authService } from "./auth.service";
export { reservaService, clienteService } from "./reserva.service";
export { servicioService, categoriaService } from "./catalog.service";
export { clienteDetailService } from "./cliente.service";
export {
  resolvePublicTenant,
  resolveAdminTenant,
  buildPublicContext,
  buildAdminContext,
  type RequestContext,
} from "./tenant-context.service";
