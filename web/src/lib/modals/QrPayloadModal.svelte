<script lang="ts">
  import { getQrUrl } from '#lib/utils/qr-utils.ts';
  import { Alert, Button, ConfirmModal, Link, toastManager } from '@immich/ui';
  import { mdiContentCopy, mdiQrcode } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    payload: string;
    onClose: (result?: boolean) => void;
  };

  let { payload, onClose }: Props = $props();

  const url = $derived(getQrUrl(payload));

  const handleClose = (confirmed: boolean) => {
    if (confirmed && url) {
      window.open(url.href, '_blank', 'noopener');
    }
    onClose(confirmed);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(payload);
    toastManager.success($t('qr_copied'));
  };
</script>

<ConfirmModal
  title={$t('qr_payload')}
  icon={mdiQrcode}
  confirmText={url ? $t('qr_open_link') : $t('close')}
  confirmColor="primary"
  size="small"
  onClose={handleClose}
>
  {#snippet prompt()}
    <div class="flex flex-col gap-4">
      <p class="max-h-40 overflow-y-auto break-all select-all">{payload}</p>
      {#if url}
        <Link href={url.href} target="_blank" rel="noopener noreferrer" class="break-all">
          {url.href}
        </Link>
      {:else}
        <Alert color="warning">{$t('qr_not_a_url')}</Alert>
        <Button onclick={handleCopy} leadingIcon={mdiContentCopy}>
          {$t('qr_copy_payload')}
        </Button>
      {/if}
    </div>
  {/snippet}
</ConfirmModal>
