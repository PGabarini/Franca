export function AnnouncementBar() {
  return (
<div className="bg-primary text-primary-foreground text-[8px] sm:text-[8px] md:text-[11px] md:text-xs tracking-brand uppercase text-center px-1">
  <div className="container-editorial py-1.5 md:py-0 md:h-6.5 flex flex-col md:flex-row items-center justify-center overflow-hidden" aria-hidden>
    <span>ENVÍOS A TODO EL PAÍS</span>
    <span className="hidden md:inline md:mx-1.5">|</span>
    <span>10% OFF ABONANDO EN EFECTIVO</span>
  </div>
</div>
  );
}
