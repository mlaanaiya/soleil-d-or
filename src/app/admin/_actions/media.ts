'use server'

import { runAdmin, type ActionState } from '@/lib/server/admin-action'
import { deleteMedia, mediaUsage, MediaError, moveGalleryItem, updateMedia } from '@/lib/server/media'

export async function editMedia(id: string, patch: { alt?: string; inGallery?: boolean }): Promise<ActionState> {
  return runAdmin(() => updateMedia(id, patch), 'Photo mise à jour.')
}

export async function moveInGallery(id: string, direction: -1 | 1): Promise<ActionState> {
  return runAdmin(() => moveGalleryItem(id, direction), 'Ordre de la galerie mis à jour.')
}

export async function removeMedia(id: string): Promise<ActionState> {
  return runAdmin(() => {
    const used = mediaUsage(id)
    if (used > 0) throw new MediaError(`Cette photo est utilisée par ${used} élément(s). Remplacez-la d’abord.`)
    deleteMedia(id)
  }, 'Photo supprimée.')
}
