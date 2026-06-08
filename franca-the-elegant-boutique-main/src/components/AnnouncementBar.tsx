export function AnnouncementBar() {
  return (
<div className="bg-primary text-primary-foreground text-[9px] sm:text-[10px] md:text-xs tracking-brand uppercase text-center px-2">
  <div className="container-editorial py-1.5 md:py-0 md:h-9 flex flex-col md:flex-row items-center justify-center overflow-hidden" aria-hidden>
    <span>ENVÍOS A TODO EL PAÍS</span>
    <span className="hidden md:inline md:mx-2">|</span>
    <span>10% OFF ABONANDO EN EFECTIVO</span>
  </div>
</div>
  );
}
