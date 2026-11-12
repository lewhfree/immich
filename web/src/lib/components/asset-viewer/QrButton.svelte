<script lang="ts">
  import { qrManager } from '#lib/stores/qr.svelte.ts';
  import { IconButton } from '@immich/ui';
  import { mdiQrcode } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<IconButton
  title={qrManager.showOverlay ? $t('hide_qr_codes') : $t('show_qr_codes')}
  icon={mdiQrcode}
  class={"dark {qrManager.showOverlay ? 'bg-immich-primary dark' : 'dark'} text-white"}
  color="secondary"
  variant="ghost"
  shape="round"
  aria-label={$t('qr_code')}
  onclick={() => qrManager.toggleQrBoundingBox()}
/>
