<script lang="ts">
  import { calculateBoundingBoxMatrix } from '#lib/utils/ocr-utils.ts';
  import type { QrBox } from '#lib/utils/qr-utils.ts';
  import { Icon } from '@immich/ui';
  import { mdiQrcode } from '@mdi/js';

  type Props = {
    qrBox: QrBox;
    onOpen: (payload: string) => void;
  };

  let { qrBox, onOpen }: Props = $props();

  const dimensions = $derived(calculateBoundingBoxMatrix(qrBox.points));

  const transform = $derived(`matrix3d(${dimensions.matrix.join(',')})`);

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onOpen(qrBox.payload);
    }
  };
</script>

<div
  class={[
    'absolute top-0 left-0 flex items-center justify-center',
    'pointer-events-auto cursor-pointer border-2 border-emerald-500',
    'focus:z-1 focus:border-3 focus:border-emerald-600 focus:outline-none',
    'bg-emerald-500/10 text-transparent transition-colors select-none hover:z-1 hover:border-3 hover:border-emerald-600 hover:bg-black/60 hover:text-white',
    'px-1 py-0.5',
  ]}
  style="width: {dimensions.width}px; height: {dimensions.height}px; transform: {transform}; transform-origin: 0 0; touch-action: none;"
  data-testid="qr-box"
  data-overlay-interactive
  role="button"
  tabindex="0"
  aria-label={qrBox.payload}
  onclick={() => onOpen(qrBox.payload)}
  onkeydown={handleKeydown}
>
  <span class="pointer-events-none flex min-w-0 items-center gap-1 truncate text-xs" aria-hidden="true">
    <Icon icon={mdiQrcode} size="1em" class="shrink-0" />
    <span class="truncate">{qrBox.payload}</span>
  </span>
</div>
