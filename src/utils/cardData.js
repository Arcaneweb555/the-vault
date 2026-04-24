const IMAGE_SIZE_ORDER = ['normal', 'large', 'png', 'small', 'art_crop', 'border_crop']
const PRIMARY_TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Battle']

export function extractPrimaryCardType(card) {
  const rawType = card?.type ?? card?.type_line ?? ''
  const matchedType = PRIMARY_TYPE_ORDER.find((type) => rawType.includes(type))
  return matchedType ?? 'Other'
}

function pickImageUris(imageUris) {
  if (!imageUris || typeof imageUris !== 'object') return null

  const trimmed = IMAGE_SIZE_ORDER.reduce((acc, key) => {
    if (imageUris[key]) acc[key] = imageUris[key]
    return acc
  }, {})

  return Object.keys(trimmed).length > 0 ? trimmed : null
}

function normaliseCardFaces(cardFaces) {
  if (!Array.isArray(cardFaces) || cardFaces.length === 0) return null

  const faces = cardFaces
    .map((face) => ({
      name: face?.name ?? '',
      mana_cost: face?.mana_cost ?? '',
      type_line: face?.type_line ?? '',
      image_uris: pickImageUris(face?.image_uris),
    }))
    .filter((face) => face.name || face.image_uris)

  return faces.length > 0 ? faces : null
}

export function resolveCardImageUrl(card) {
  if (!card || typeof card !== 'object') return null
  if (card.imageUrl) return card.imageUrl

  for (const key of IMAGE_SIZE_ORDER) {
    if (card.image_uris?.[key]) return card.image_uris[key]
  }

  for (const face of card.card_faces ?? []) {
    for (const key of IMAGE_SIZE_ORDER) {
      if (face?.image_uris?.[key]) return face.image_uris[key]
    }
  }

  return null
}

export function normaliseCardImages(card) {
  return {
    imageUrl: resolveCardImageUrl(card),
    image_uris: pickImageUris(card?.image_uris),
    card_faces: normaliseCardFaces(card?.card_faces),
  }
}

export function normalisePulledCardForDeck(card) {
  const { imageUrl, image_uris, card_faces } = normaliseCardImages(card)
  const primaryType = extractPrimaryCardType(card)

  return {
    quantity: Math.max(1, Number.parseInt(card?.quantity ?? 1, 10) || 1),
    id: card?.id ?? card?.scryfallId ?? card?.oracle_id ?? card?.name,
    scryfallId: card?.scryfallId ?? card?.id ?? null,
    oracle_id: card?.oracle_id ?? null,
    name: card?.name ?? 'Unknown Card',
    type: primaryType,
    type_line: card?.type_line ?? card?.type ?? primaryType,
    mana_cost: card?.mana_cost ?? '',
    cmc: Number.isFinite(card?.cmc) ? card.cmc : 0,
    rarity: card?.rarity ?? 'common',
    imageUrl,
    image_uris,
    card_faces,
    prices: card?.prices
      ? {
          usd: card.prices.usd ?? null,
          usd_foil: card.prices.usd_foil ?? null,
        }
      : null,
    isFoil: Boolean(card?.isFoil),
  }
}
