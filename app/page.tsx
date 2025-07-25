"use client"

import type React from "react"
// FIX: Envolvemos várias funções em useCallback e corrigimos as dependências do useEffect.
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload,
  FileText,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
  X,
  Save,
  FolderOpen,
  Trash2,
  Shuffle,
  BarChart3,
  TrendingUp,
  Coins,
  Library,
  Copy,
  Hammer,
  Plus,
  Minus,
  Download,
  Settings,
} from "lucide-react"

interface MTGCard {
  id: string
  name: string
  set_name: string
  set_code: string
  collector_number: string
  rarity: string
  mana_cost?: string
  cmc: number
  type_line: string
  oracle_text?: string
  power?: string
  toughness?: string
  artist: string
  lang: string
  released_at: string
  image_uris?: {
    normal: string
    small?: string
    art_crop?: string
  }
  card_faces?: Array<{
    name: string
    mana_cost?: string
    type_line: string
    oracle_text?: string
    power?: string
    toughness?: string
    image_uris?: {
      normal: string
      small?: string
      art_crop?: string
    }
  }>
  color_identity: string[]
  foil: boolean
  nonfoil: boolean
  prints_search_uri: string
}

interface CollectionCard {
  card: MTGCard
  quantity: number
  condition: string
  foil: boolean
  addedAt: string
}

interface UserCollection {
  id: string
  name: string
  description: string
  cards: CollectionCard[]
  createdAt: string
  updatedAt: string
  isPublic: boolean
}

interface OwnedCard {
  originalEntry: Record<string, string>
  scryfallData: MTGCard
}

interface DeckCard {
  card: MTGCard
  quantity: number
  isCommander?: boolean
  isSideboard?: boolean
}

interface SavedDeck {
  id: string
  name: string
  format: string
  mainboard: DeckCard[]
  sideboard: DeckCard[]
  commander?: DeckCard
  description?: string
  createdAt: string
  updatedAt: string
}

interface SavedFilter {
  id: string
  name: string
  collectionType: string
  filters: {
    searchQuery: string
    ownershipFilter: string
    sortBy: string
    sortAscending: boolean
    rarityFilter: string
    cmcFilter: string
    powerFilter: string
    toughnessFilter: string
    languageFilter: string
    artistFilter: string
    oracleTextFilter: string
    foilFilter: string
    activeColors: string[]
  }
  createdAt: string
}

const cardTypes = [
  { value: "creature", label: "Criaturas" },
  { value: "land", label: "Terrenos" },
  { value: "artifact", label: "Artefatos" },
  { value: "enchantment", label: "Encantamentos" },
  { value: "instant", label: "Mágicas Instantâneas" },
  { value: "sorcery", label: "Feitiçarias" },
  { value: "planeswalker", label: "Planeswalkers" },
]

export default function MTGCollectionManager() {
  const [allCards, setAllCards] = useState<MTGCard[]>([])
  const [deckBuilderCards, setDeckBuilderCards] = useState<MTGCard[]>([])
  const [ownedCardsMap, setOwnedCardsMap] = useState<Map<string, OwnedCard>>(new Map())
  const [filteredCards, setFilteredCards] = useState<MTGCard[]>([])
  const [filteredDeckCards, setFilteredDeckCards] = useState<MTGCard[]>([])
  const [visibleCount, setVisibleCount] = useState(25)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [collectionType, setCollectionType] = useState("all")
  const [selectedCard, setSelectedCard] = useState<MTGCard | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [textView, setTextView] = useState(false)
  const [currentColumns, setCurrentColumns] = useState(7)
  const [hiddenSets, setHiddenSets] = useState<Set<string>>(new Set())
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [activeTab, setActiveTab] = useState("collection")

  // New collection states
  const [currentCollection, setCurrentCollection] = useState<UserCollection>({
    id: "",
    name: "Minha Coleção",
    description: "",
    cards: [],
    createdAt: "",
    updatedAt: "",
    isPublic: false,
  })
  const [savedCollections, setSavedCollections] = useState<UserCollection[]>([])
  const [showSaveCollectionDialog, setShowSaveCollectionDialog] = useState(false)
  const [showLoadCollectionDialog, setShowLoadCollectionDialog] = useState(false)

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<{
    id: string
    name: string
    email: string
    firstName?: string
    lastName?: string
    avatar?: string
    bio?: string
  } | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  })
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // Deck Builder States
  const [currentDeck, setCurrentDeck] = useState<SavedDeck>({
    id: "",
    name: "Novo Deck",
    format: "standard",
    mainboard: [],
    sideboard: [],
    description: "",
    createdAt: "",
    updatedAt: "",
  })
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([])
  const [deckSearchQuery, setDeckSearchQuery] = useState("")
  const [showDeckSaveDialog, setShowDeckSaveDialog] = useState(false)
  const [showDeckLoadDialog, setShowDeckLoadDialog] = useState(false)
  const [deckImportText, setDeckImportText] = useState("")
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isSearchingCards, setIsSearchingCards] = useState(false)

  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string>("")
  const [isLoadingBackground, setIsLoadingBackground] = useState(false)

  // Filter states
  const [ownershipFilter, setOwnershipFilter] = useState("all")
  const [sortBy, setSortBy] = useState("edition")
  const [sortAscending, setSortAscending] = useState(false)
  const [rarityFilter, setRarityFilter] = useState("all")
  const [cmcFilter, setCmcFilter] = useState("")
  const [powerFilter, setPowerFilter] = useState("")
  const [toughnessFilter, setToughnessFilter] = useState("")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [artistFilter, setArtistFilter] = useState("all")
  const [oracleTextFilter, setOracleTextFilter] = useState("")
  const [foilFilter, setFoilFilter] = useState("all")
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([])
  const [availableArtists, setAvailableArtists] = useState<string[]>([])
  const [activeColors, setActiveColors] = useState<Set<string>>(new Set(["W", "U", "B", "R", "G", "C"]))

  // Saved filters states
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Rules tab states
  const [rulesSearchQuery, setRulesSearchQuery] = useState("")
  const [selectedRulesCard, setSelectedRulesCard] = useState<MTGCard | null>(null)
  const [cardRulings, setCardRulings] = useState<any[]>([])
  const [isLoadingRulings, setIsLoadingRulings] = useState(false)
  const [rulesSource, setRulesSource] = useState<"search" | "collection" | "deck">("search")
  const [selectedCollectionForRules, setSelectedCollectionForRules] = useState<string>("")
  const [selectedDeckForRules, setSelectedDeckForRules] = useState<string>("")
  const [availableRulesCards, setAvailableRulesCards] = useState<MTGCard[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const columnOptions = [3, 5, 7]
  const abortControllerRef = useRef<AbortController | null>(null)

  const normalize = (str: string | null | undefined) => {
    if (!str || typeof str !== "string") return ""
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  // Função para buscar preço no Liga Magic
  const fetchLigaMagicPrice = async (cardName: string): Promise<number | null> => {
    try {
      // Normalizar nome da carta para busca
      const searchName = cardName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '+')
      
      // Simular busca no Liga Magic (em produção, seria uma API real)
      // Por enquanto, vamos retornar null para usar o fallback
      const response = await fetch(`https://api.ligamagic.com.br/search?q=${searchName}`, {
        headers: {
          'User-Agent': 'MTGCollectionManager/1.0'
        }
      }).catch(() => null)
      
      if (response && response.ok) {
        const data = await response.json()
        if (data.price) {
          return data.price
        }
      }
      
      return null
    } catch (error) {
      console.error('Erro ao buscar preço no Liga Magic:', error)
      return null
    }
  }

  // Função para simular preço baseado na raridade e tipo (synchronous)
  const getEstimatedPrice = (card: MTGCard): number => {
    const basePrice = {
      common: 0.5,
      uncommon: 2.0,
      rare: 15.0,
      mythic: 35.0,
    }

    const typeMultiplier = {
      planeswalker: 2.5,
      legendary: 1.8,
      artifact: 1.3,
      enchantment: 1.2,
      instant: 1.1,
      sorcery: 1.1,
      creature: 1.0,
    }

    let price = basePrice[card.rarity as keyof typeof basePrice] || 1.0

    // Aplicar multiplicador por tipo
    for (const [type, multiplier] of Object.entries(typeMultiplier)) {
      if (card.type_line.toLowerCase().includes(type)) {
        price *= multiplier
        break
      }
    }

    // Variação aleatória baseada no ID da carta para consistência
    const seed = card.id.charCodeAt(0) + card.id.charCodeAt(1)
    const variation = 0.5 + (seed % 100) / 100 // 0.5 a 1.5
    price *= variation

    // Converter para reais (simulando cotação USD -> BRL)
    return price * 5.2
  }

  // Collection functions
  const addCardToCollection = (card: MTGCard, quantity = 1, condition = "Near Mint", foil = false) => {
    setCurrentCollection((prev) => {
      const existingIndex = prev.cards.findIndex((c) => c.card.id === card.id && c.foil === foil)

      let newCards
      if (existingIndex >= 0) {
        newCards = [...prev.cards]
        newCards[existingIndex] = {
          ...newCards[existingIndex],
          quantity: newCards[existingIndex].quantity + quantity,
        }
      } else {
        const newCard: CollectionCard = {
          card,
          quantity,
          condition,
          foil,
          addedAt: new Date().toISOString(),
        }
        newCards = [...prev.cards, newCard]
      }

      return {
        ...prev,
        cards: newCards,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const removeCardFromCollection = (cardId: string, foil = false, quantity = 1) => {
    setCurrentCollection((prev) => {
      const newCards = prev.cards
        .map((c) => {
          if (c.card.id === cardId && c.foil === foil) {
            const newQuantity = c.quantity - quantity
            return newQuantity > 0 ? { ...c, quantity: newQuantity } : null
          }
          return c
        })
        .filter(Boolean) as CollectionCard[]

      return {
        ...prev,
        cards: newCards,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const getCardQuantityInCollection = (cardId: string, foil = false) => {
    const collectionCard = currentCollection.cards.find((c) => c.card.id === cardId && c.foil === foil)
    return collectionCard?.quantity || 0
  }

  const saveCollection = () => {
  const collectionToSave: UserCollection = {
    ...currentCollection,
    id: currentCollection.id || Date.now().toString(),
    name: currentCollection.name || "Minha Coleção",
    createdAt: currentCollection.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  setSavedCollections((prev) => {
    const existingIndex = prev.findIndex((c) => c.id === collectionToSave.id)
    if (existingIndex >= 0) {
      const newCollections = [...prev]
      newCollections[existingIndex] = collectionToSave
      return newCollections
    } else {
      return [...prev, collectionToSave]
    }
  })

  setCurrentCollection(collectionToSave)
  setShowSaveCollectionDialog(false)
}

  const newCollection = () => {
    setCurrentCollection({
      id: "",
      name: "Minha Coleção",
      description: "",
      cards: [],
      createdAt: "",
      updatedAt: "",
      isPublic: false,
    })
  }

  const deleteCollection = (collectionId: string) => {
    setSavedCollections((prev) => prev.filter((c) => c.id !== collectionId))
  }
  
  const loadCollection = (collection: UserCollection) => {
    setCurrentCollection(collection);
    // Re-populate ownedCardsMap from the loaded collection for filtering
    const newOwnedCards = new Map<string, OwnedCard>();
    collection.cards.forEach(cc => {
        // Create a minimal original entry for compatibility
        const entry: Record<string, string> = {
            Name: cc.card.name,
            Quantity: cc.quantity.toString(),
            Set: cc.card.set_name,
        };
        newOwnedCards.set(cc.card.id, {
            originalEntry: entry,
            scryfallData: cc.card,
        });
    });
    setOwnedCardsMap(newOwnedCards);
    setShowLoadCollectionDialog(false);
  };

  // Calcular estatísticas do dashboard
  const dashboardStats = useMemo(() => {
    const collectionCards = currentCollection.cards

    // Valor estimado total
    const totalValue = collectionCards.reduce((sum, collectionCard) => {
      const cardPrice = getEstimatedPrice(collectionCard.card)
      return sum + cardPrice * collectionCard.quantity
    }, 0)

    // Cartas únicas
    const uniqueCards = collectionCards.length

    // Total de cópias
    const totalCopies = collectionCards.reduce((sum, collectionCard) => {
      return sum + collectionCard.quantity
    }, 0)

    // Distribuição por tipo
    const typeDistribution: Record<string, number> = {}
    collectionCards.forEach((collectionCard) => {
      const types = collectionCard.card.type_line.split("—")[0].trim().split(" ")
      types.forEach((type) => {
        const cleanType = type.replace(/[^a-zA-Z]/g, "").toLowerCase()
        if (cleanType) {
          typeDistribution[cleanType] = (typeDistribution[cleanType] || 0) + collectionCard.quantity
        }
      })
    })

    // Distribuição por cor
    const colorDistribution: Record<string, number> = {
      W: 0,
      U: 0,
      B: 0,
      R: 0,
      G: 0,
      C: 0, // Incolor
    }

    collectionCards.forEach((collectionCard) => {
      const colors = collectionCard.card.color_identity
      if (colors.length === 0) {
        colorDistribution.C += collectionCard.quantity
      } else {
        colors.forEach((color) => {
          if (colorDistribution[color] !== undefined) {
            colorDistribution[color] += collectionCard.quantity
          }
        })
      }
    })

    // Distribuição por raridade
    const rarityDistribution: Record<string, number> = {}
    collectionCards.forEach((collectionCard) => {
      const rarity = collectionCard.card.rarity
      rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + collectionCard.quantity
    })

    // Distribuição por CMC
    const cmcDistribution: Record<number, number> = {}
    collectionCards.forEach((collectionCard) => {
      const cmc = collectionCard.card.cmc
      cmcDistribution[cmc] = (cmcDistribution[cmc] || 0) + collectionCard.quantity
    })

    return {
      totalValue,
      uniqueCards,
      totalCopies,
      typeDistribution,
      colorDistribution,
      rarityDistribution,
      cmcDistribution,
    }
  }, [currentCollection])

  // Calcular estatísticas do deck
  const deckStats = useMemo(() => {
    const allDeckCards = [...currentDeck.mainboard, ...currentDeck.sideboard]
    if (currentDeck.commander) {
      allDeckCards.push(currentDeck.commander)
    }

    // Total de cartas
    const totalCards = currentDeck.mainboard.reduce((sum, deckCard) => sum + deckCard.quantity, 0)
    const sideboardCards = currentDeck.sideboard.reduce((sum, deckCard) => sum + deckCard.quantity, 0)

    // Curva de mana
    const manaCurve: Record<number, number> = {}
    currentDeck.mainboard.forEach((deckCard) => {
      const cmc = deckCard.card.cmc
      manaCurve[cmc] = (manaCurve[cmc] || 0) + deckCard.quantity
    })

    // Distribuição por cor
    const colorDistribution: Record<string, number> = {
      W: 0,
      U: 0,
      B: 0,
      R: 0,
      G: 0,
      C: 0,
    }

    allDeckCards.forEach((deckCard) => {
      const colors = deckCard.card.color_identity
      if (colors.length === 0) {
        colorDistribution.C += deckCard.quantity
      } else {
        colors.forEach((color) => {
          if (colorDistribution[color] !== undefined) {
            colorDistribution[color] += deckCard.quantity
          }
        })
      }
    })

    // Distribuição por tipo
    const typeDistribution: Record<string, number> = {}
    allDeckCards.forEach((deckCard) => {
      const types = deckCard.card.type_line.split("—")[0].trim().split(" ")
      types.forEach((type) => {
        const cleanType = type.replace(/[^a-zA-Z]/g, "").toLowerCase()
        if (cleanType) {
          typeDistribution[cleanType] = (typeDistribution[cleanType] || 0) + deckCard.quantity
        }
      })
    })

    // Valor estimado
    const totalValue = allDeckCards.reduce((sum, deckCard) => {
      const cardPrice = getEstimatedPrice(deckCard.card)
      return sum + cardPrice * deckCard.quantity
    }, 0)

    return {
      totalCards,
      sideboardCards,
      manaCurve,
      colorDistribution,
      typeDistribution,
      totalValue,
    }
  }, [currentDeck])

  // Componente para gráfico de barras simples
  const SimpleBarChart = ({
    data,
    title,
    colorMap,
  }: {
    data: Record<string, number>
    title: string
    colorMap?: Record<string, string>
  }) => {
    const maxValue = Math.max(...Object.values(data), 1) // Prevent division by zero
    const entries = Object.entries(data).sort(([keyA], [keyB]) => {
      // Custom sort for CMC
      if (title.toLowerCase().includes('cmc')) {
        return parseInt(keyA, 10) - parseInt(keyB, 10);
      }
      // Default sort by value
      return data[keyB] - data[keyA];
    });

    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 capitalize">{key}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(value / maxValue) * 100}%`,
                      backgroundColor: colorMap?.[key] || "#3b82f6",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Funções do Deck Builder
  const addCardToDeck = (card: MTGCard, quantity = 1, isSideboard = false) => {
    setCurrentDeck((prev) => {
      const targetArray = isSideboard ? prev.sideboard : prev.mainboard
      const existingIndex = targetArray.findIndex((deckCard) => deckCard.card.id === card.id)

      let newArray
      if (existingIndex >= 0) {
        newArray = [...targetArray]
        newArray[existingIndex] = {
          ...newArray[existingIndex],
          quantity: newArray[existingIndex].quantity + quantity,
        }
      } else {
        newArray = [...targetArray, { card, quantity, isSideboard }]
      }

      return {
        ...prev,
        [isSideboard ? "sideboard" : "mainboard"]: newArray,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const removeCardFromDeck = (cardId: string, quantity = 1, isSideboard = false) => {
    setCurrentDeck((prev) => {
      const targetArray = isSideboard ? prev.sideboard : prev.mainboard
      const newArray = targetArray
        .map((deckCard) => {
          if (deckCard.card.id === cardId) {
            const newQuantity = deckCard.quantity - quantity
            return newQuantity > 0 ? { ...deckCard, quantity: newQuantity } : null
          }
          return deckCard
        })
        .filter(Boolean) as DeckCard[]

      return {
        ...prev,
        [isSideboard ? "sideboard" : "mainboard"]: newArray,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const importDeckFromText = (text: string) => {
    
    const lines = text.split("\n").filter((line) => line.trim())
    const newMainboard: DeckCard[] = []
    const newSideboard: DeckCard[] = []
    let isInSideboard = false

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Detectar seção do sideboard
      if (trimmedLine.toLowerCase().startsWith("sideboard") || trimmedLine.toLowerCase().startsWith("side:") || trimmedLine.toLowerCase().startsWith("// sideboard")) {
        isInSideboard = true
        continue
      }

      // Pular linhas vazias ou comentários
      if (!trimmedLine || trimmedLine.startsWith("//") || trimmedLine.startsWith("#")) {
        continue
      }

      // Tentar extrair quantidade e nome da carta
      const match = trimmedLine.match(/^(\d+)\s*x?\s*(.+)$/i) // handles "4x Lightning Bolt" and "4 Lightning Bolt"
      if (match) {
        const quantity = Number.parseInt(match[1], 10)
        const cardName = match[2].trim()

        // FIX: Assegurar que as cartas do construtor de baralhos estão carregadas antes de tentar encontrar uma carta.
        // A lógica atual procura corretamente em `deckBuilderCards`, que é preenchida na troca de separador.
        // Se não encontrar, podemos adicionar um placeholder ou registar um erro. A falha silenciosa atual é aceitável.
        const foundCard = deckBuilderCards.find((card) => normalize(card.name) === normalize(cardName))

        if (foundCard) {
          const deckCard: DeckCard = {
            card: foundCard,
            quantity,
            isSideboard: isInSideboard,
          }

          if (isInSideboard) {
            newSideboard.push(deckCard)
          } else {
            newMainboard.push(deckCard)
          }
        } else {
          console.warn(`Carta não encontrada na base de dados do construtor: ${cardName}`)
        }
      }
    }

    setCurrentDeck((prev) => ({
      ...prev,
      mainboard: newMainboard,
      sideboard: newSideboard,
      updatedAt: new Date().toISOString(),
    }))

    setShowImportDialog(false)
    setDeckImportText("")
  }

  const exportDeckToText = () => {
    let text = `// ${currentDeck.name}\n// ${currentDeck.format.toUpperCase()}\n\n`

    // Mainboard
    text += "// Mainboard\n"
    currentDeck.mainboard.forEach((deckCard) => {
      text += `${deckCard.quantity} ${deckCard.card.name}\n`
    })

    // Sideboard
    if (currentDeck.sideboard.length > 0) {
      text += "\n// Sideboard\n"
      currentDeck.sideboard.forEach((deckCard) => {
        text += `${deckCard.quantity} ${deckCard.card.name}\n`
      })
    }

    // Commander
    if (currentDeck.commander) {
      text += "\n// Commander\n"
      text += `1 ${currentDeck.commander.card.name}\n`
    }

    return text
  }

  const saveDeck = () => {
    const deckToSave: SavedDeck = {
      ...currentDeck,
      id: currentDeck.id || Date.now().toString(),
      createdAt: currentDeck.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setSavedDecks((prev) => {
      const existingIndex = prev.findIndex((deck) => deck.id === deckToSave.id)
      if (existingIndex >= 0) {
        const newDecks = [...prev]
        newDecks[existingIndex] = deckToSave
        return newDecks
      } else {
        return [...prev, deckToSave]
      }
    })

    setCurrentDeck(deckToSave)
    setShowDeckSaveDialog(false)
  }

  const loadDeck = (deck: SavedDeck) => {
    setCurrentDeck(deck)
    setShowDeckLoadDialog(false)
  }

  const newDeck = () => {
    setCurrentDeck({
      id: "",
      name: "Novo Deck",
      format: "standard",
      mainboard: [],
      sideboard: [],
      // FIX: Corrigido o erro de digitação de `sdescription` para `description`
      description: "",
      createdAt: "",
      updatedAt: "",
    })
  }

  const deleteDeck = (deckId: string) => {
    setSavedDecks((prev) => prev.filter((deck) => deck.id !== deckId))
  }

  // Função para buscar imagem de background aleatória
  const fetchRandomBackground = useCallback(async () => {
    setIsLoadingBackground(true)
    try {
      console.log("Buscando background aleatório...")
      const response = await fetch("https://api.scryfall.com/cards/random?q=is:art_crop")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const card = await response.json()
      console.log("Carta recebida:", card.name)

      // Priorizar art_crop, depois normal, depois card_faces
      let imageUrl = null
      if (card.image_uris?.art_crop) {
        imageUrl = card.image_uris.art_crop
      } else if (card.image_uris?.normal) {
        imageUrl = card.image_uris.normal
      } else if (card.card_faces?.[0]?.image_uris?.art_crop) {
        imageUrl = card.card_faces[0].image_uris.art_crop
      } else if (card.card_faces?.[0]?.image_uris?.normal) {
        imageUrl = card.card_faces[0].image_uris.normal
      }

      if (imageUrl) {
        console.log("URL da imagem:", imageUrl)
        localStorage.setItem("mtg-background-image", imageUrl)
        setBackgroundImage(imageUrl)
        console.log("Background definido com sucesso!")
      } else {
        console.warn("Nenhuma imagem encontrada na carta, a tentar novamente...")
        // Se a carta aleatória não tiver arte, tente novamente.
        setTimeout(fetchRandomBackground, 500);
      }
    } catch (error) {
      console.error("Erro ao buscar background:", error)
      // Tentar novamente após 2 segundos
      setTimeout(fetchRandomBackground, 2000)
    } finally {
      setIsLoadingBackground(false)
    }
  }, [])

  // Authentication functions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)

    try {
      // Simular autenticação
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (isRegistering) {
        // Simular registro
        if (loginForm.password !== loginForm.confirmPassword) {
          // Use um modal personalizado ou um elemento de UI para mensagens
          console.error("Senhas não coincidem!")
          return
        }

        const newUser = {
          id: Date.now().toString(),
          name: loginForm.name,
          email: loginForm.email,
          firstName: loginForm.name.split(" ")[0] || "",
          lastName: loginForm.name.split(" ").slice(1).join(" ") || "",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginForm.email}`,
          bio: "",
        }

        setCurrentUser(newUser)
        localStorage.setItem("mtg-user", JSON.stringify(newUser))
        console.log("Utilizador registado com sucesso!")
      } else {
        // Simular login
        const user = {
          id: "user_123",
          name: loginForm.email.split("@")[0],
          email: loginForm.email,
          firstName: loginForm.email.split("@")[0],
          lastName: "",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginForm.email}`,
          bio: "",
        }

        setCurrentUser(user)
        localStorage.setItem("mtg-user", JSON.stringify(user))
        console.log("Login efetuado com sucesso!")
      }

      setIsAuthenticated(true)
      setShowLoginDialog(false)
      setLoginForm({ email: "", password: "", name: "", confirmPassword: "" })
    } catch (error) {
      console.error("Erro na autenticação:", error)
      // Use um modal personalizado ou um elemento de UI para mensagens
      console.error("Erro na autenticação. Tente novamente.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    localStorage.removeItem("mtg-user")
    // Limpar dados da sessão se necessário
    setOwnedCardsMap(new Map())
    setSavedDecks([])
    setSavedFilters([])
    setSavedCollections([])
    setCurrentCollection({
      id: "",
      name: "Minha Coleção",
      description: "",
      cards: [],
      createdAt: "",
      updatedAt: "",
      isPublic: false,
    })
    console.log("Logout efetuado com sucesso!")
  }

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering)
    setLoginForm({ email: "", password: "", name: "", confirmPassword: "" })
  }

  // Profile functions
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)

    try {
      // Simular atualização de perfil
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Validar palavra-passe atual (simulado)
      if (profileForm.newPassword && !profileForm.currentPassword) {
        // Use um modal personalizado ou um elemento de UI para mensagens
        console.error("Digite a sua palavra-passe atual para alterar a palavra-passe.")
        return
      }

      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmNewPassword) {
        // Use um modal personalizado ou um elemento de UI para mensagens
        console.error("As novas palavras-passe não coincidem!")
        return
      }

      const updatedUser = {
        ...currentUser!,
        firstName: profileForm.firstName || currentUser!.firstName,
        lastName: profileForm.lastName || currentUser!.lastName,
        email: profileForm.email || currentUser!.email,
        bio: profileForm.bio || currentUser!.bio,
        name: `${profileForm.firstName || currentUser!.firstName} ${profileForm.lastName || currentUser!.lastName}`.trim(),
      }

      setCurrentUser(updatedUser)
      localStorage.setItem("mtg-user", JSON.stringify(updatedUser))
      setShowProfileDialog(false)

      // Limpar campos de palavra-passe
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }))

      console.log("Perfil atualizado com sucesso!")
      // Use um modal personalizado ou um elemento de UI para mensagens
      console.log("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      // Use um modal personalizado ou um elemento de UI para mensagens
      console.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setLoginLoading(false)
    }
  }

  // Função para procurar uma carta específica na API do Scryfall
  const findCardOnScryfall = async (cardName: string, setCode?: string): Promise<MTGCard | null> => {
    // URL base para a busca por nome exato
    let url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
    
    // Se um código de edição for fornecido, adicione-o à query para uma busca mais precisa
    if (setCode) {
      url += `&set=${encodeURIComponent(setCode)}`;
    }

    try {
      // Pequeno atraso para não sobrecarregar a API do Scryfall com muitas requisições rápidas
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms de atraso

      const response = await fetch(url);

      // Se a carta não for encontrada (404), e tentamos com uma edição,
      // vamos tentar novamente sem a edição.
      if (!response.ok && response.status === 404 && setCode) {
        console.warn(`Carta "${cardName}" não encontrada na edição "${setCode}". Tentando sem edição...`);
        return await findCardOnScryfall(cardName); // Chamada recursiva sem a edição
      }

      if (!response.ok) {
        throw new Error(`Erro na API Scryfall: ${response.status}`);
      }
      
      const card = await response.json();
      return card;

    } catch (error) {
      // Não logamos o erro final aqui, pois a função que chama irá fazê-lo.
      return null;
    }
  };

  // FIX: handleFileUpload agora procura cartas na API do Scryfall se não as encontrar localmente.
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const text = await file.text();
      const lines = text
        .split("\n")
        .map((l) => l.trim().replace(/\r/g, '')) // Limpa espaços e carriage returns
        .filter(Boolean);

      if (lines.length <= 1) {
        console.warn("O ficheiro CSV está vazio ou contém apenas cabeçalhos.");
        setLoading(false);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const nameIndex = headers.findIndex(h => normalize(h).includes("name") || normalize(h).includes("nome"));
      const quantityIndex = headers.findIndex(h => normalize(h).includes("quantity") || normalize(h).includes("quantidade") || normalize(h).includes("qty"));
      const setIndex = headers.findIndex(h => normalize(h).includes("set") || normalize(h).includes("edition") || normalize(h).includes("edicao"));

      if (nameIndex === -1) {
        console.error("Coluna de nome não encontrada no CSV.");
        setLoading(false);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      const collectionUpdates = new Map<string, { card: MTGCard; quantity: number; foil: boolean }>();

      // Usar um loop for...of para permitir o uso de 'await' dentro dele
      for (const [index, line] of lines.slice(1).entries()) {
        setLoadingMessage(`A processar linha ${index + 1}/${lines.length - 1}...`);

        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const cardName = values[nameIndex];
        const cardSet = setIndex >= 0 ? values[setIndex] : "";
        const quantity = quantityIndex >= 0 ? Number.parseInt(values[quantityIndex], 10) || 1 : 1;

        if (!cardName) continue;

        // 1. Tentar encontrar a carta localmente primeiro (otimização)
        let matchingCard: MTGCard | null = allCards.find(
          (card) =>
            normalize(card.name) === normalize(cardName) &&
            (!cardSet || normalize(card.set_name) === normalize(cardSet) || normalize(card.set_code) === normalize(cardSet))
        );

        // 2. Se não for encontrada localmente, procurar na API do Scryfall
        if (!matchingCard) {
          console.log(`Carta "${cardName}" não encontrada localmente. A procurar no Scryfall...`);
          matchingCard = await findCardOnScryfall(cardName, cardSet);
        }

        // 3. Processar a carta se foi encontrada (localmente OU via API)
        if (matchingCard) {
          const key = `${matchingCard.id}-false`; // Assumindo não-foil por enquanto
          const existing = collectionUpdates.get(key);
          if (existing) {
            existing.quantity += quantity;
          } else {
            collectionUpdates.set(key, { card: matchingCard, quantity, foil: false });
          }
          successCount++;
        } else {
          console.warn(`FALHA FINAL: Carta não encontrada no Scryfall: ${cardName} (Edição: ${cardSet || 'N/A'})`);
          errorCount++;
        }
      }
      
      // 4. Atualizar o estado da coleção de uma só vez para melhor performance
      setCurrentCollection((prev) => {
        const newCards = [...prev.cards];
        const newOwnedCards = new Map(ownedCardsMap);
        
        collectionUpdates.forEach(update => {
            // Adicionar ao mapa de posse para filtros
            const entry: Record<string, string> = { Name: update.card.name, Quantity: update.quantity.toString(), Set: update.card.set_name };
            newOwnedCards.set(update.card.id, { originalEntry: entry, scryfallData: update.card });

            // Adicionar ou atualizar na coleção atual
            const existingIndex = newCards.findIndex(c => c.card.id === update.card.id && c.foil === update.foil);
            if (existingIndex > -1) {
                newCards[existingIndex].quantity += update.quantity;
            } else {
                newCards.push({
                    card: update.card,
                    quantity: update.quantity,
                    condition: "Near Mint", // Condição padrão
                    foil: update.foil,
                    addedAt: new Date().toISOString()
                });
            }
        });
        
        setOwnedCardsMap(newOwnedCards);
        return { ...prev, cards: newCards, updatedAt: new Date().toISOString() };
      });

      setLoadingMessage(`Processamento concluído. ${successCount} cartas carregadas, ${errorCount} falharam.`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Manter a mensagem por 3 segundos
      
    } catch (error) {
      console.error("Erro ao processar o ficheiro CSV:", error);
      setLoadingMessage("Ocorreu um erro. Verifique a consola para mais detalhes.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Limpa o input de ficheiro
      }
    }
  };


  // Load saved background from localStorage and fetch new one if needed
  useEffect(() => {
    const savedBackground = localStorage.getItem("mtg-background-image")
    if (savedBackground) {
      setBackgroundImage(savedBackground)
    } else {
      fetchRandomBackground()
    }
  }, [fetchRandomBackground])

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem("mtg-user")
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
        setIsAuthenticated(true)

        // Initialize profile form with user data
        setProfileForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          bio: user.bio || "",
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        })
      } catch (error) {
        console.error("Erro ao carregar utilizador salvo:", error)
        localStorage.removeItem("mtg-user")
      }
    }
  }, [])

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("mtg-saved-filters")
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved filters:", error)
      }
    }

    const savedDecksData = localStorage.getItem("mtg-saved-decks")
    if (savedDecksData) {
      try {
        setSavedDecks(JSON.parse(savedDecksData))
      } catch (error) {
        console.error("Error loading saved decks:", error)
      }
    }

    const savedCollectionsData = localStorage.getItem("mtg-saved-collections")
    if (savedCollectionsData) {
      try {
        setSavedCollections(JSON.parse(savedCollectionsData))
      } catch (error) {
        console.error("Error loading saved collections:", error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("mtg-saved-filters", JSON.stringify(savedFilters))
  }, [savedFilters])

  useEffect(() => {
    localStorage.setItem("mtg-saved-decks", JSON.stringify(savedDecks))
  }, [savedDecks])

  useEffect(() => {
    localStorage.setItem("mtg-saved-collections", JSON.stringify(savedCollections))
  }, [savedCollections])

  // Update profile form when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm((prev) => ({
        ...prev,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
      }))
    }
  }, [currentUser])

  // Função para salvar filtros atuais
  const saveCurrentFilters = () => {
    if (!filterName.trim()) {
      // Use um modal personalizado ou um elemento de UI para mensagens
      console.error("Por favor, digite um nome para o filtro.")
      return
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      collectionType: collectionType || "all",
      filters: {
        searchQuery,
        ownershipFilter,
        sortBy,
        sortAscending,
        rarityFilter,
        cmcFilter,
        powerFilter,
        toughnessFilter,
        languageFilter,
        artistFilter,
        oracleTextFilter,
        foilFilter,
        activeColors: Array.from(activeColors),
      },
      createdAt: new Date().toISOString(),
    }

    setSavedFilters((prev) => [...prev, newFilter])
    setFilterName("")
    setShowSaveDialog(false)
    console.log(`Filtro "${newFilter.name}" salvo com sucesso!`)
  }

  // Função para carregar filtros salvos
  const loadSavedFilter = (savedFilter: SavedFilter) => {
    // Se o tipo de coleção for diferente, trocar primeiro
    if (savedFilter.collectionType !== collectionType) {
      setCollectionType(savedFilter.collectionType)
    }

    // Aplicar todos os filtros
    setSearchQuery(savedFilter.filters.searchQuery)
    setOwnershipFilter(savedFilter.filters.ownershipFilter)
    setSortBy(savedFilter.filters.sortBy)
    setSortAscending(savedFilter.filters.sortAscending)
    setRarityFilter(savedFilter.filters.rarityFilter)
    setCmcFilter(savedFilter.filters.cmcFilter)
    setPowerFilter(savedFilter.filters.powerFilter)
    setToughnessFilter(savedFilter.filters.toughnessFilter)
    setLanguageFilter(savedFilter.filters.languageFilter)
    setArtistFilter(savedFilter.filters.artistFilter)
    setOracleTextFilter(savedFilter.filters.oracleTextFilter)
    setFoilFilter(savedFilter.filters.foilFilter)
    setActiveColors(new Set(savedFilter.filters.activeColors))

    setShowLoadDialog(false)
    console.log(`Filtro "${savedFilter.name}" carregado com sucesso!`)
  }

  // Função para deletar filtro salvo
  const deleteSavedFilter = (filterId: string) => {
    setSavedFilters((prev) => prev.filter((f) => f.id !== filterId))
    console.log("Filtro deletado com sucesso!")
  }

  // Função para cancelar carregamento
  const cancelLoading = () => {
    console.log("A cancelar carregamento...")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoadingCards(false)
    setLoading(false)
    setLoadingMessage("")
  }

  // Função para obter URL da imagem otimizada
  const getOptimizedImageUrl = (card: MTGCard, preferSmall = false) => {
    const imageUris = card.image_uris || card.card_faces?.[0]?.image_uris
    if (!imageUris) return "/placeholder.svg?height=310&width=223"

    if (preferSmall && imageUris.small) {
      return imageUris.small
    }
    return imageUris.normal || "/placeholder.svg?height=310&width=223"
  }

  // Função para carregar cartas gerais (para coleção)
  // FIX: Envolvida em useCallback para estabilizar a sua identidade para o useEffect
  const fetchGeneralCards = useCallback(async () => {
    if (isLoadingCards) {
      console.log("Já está a carregar cartas, a ignorar nova chamada")
      return
    }

    console.log("A iniciar carregamento de cartas gerais...")

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoadingCards(true)
    setLoading(true)
    setLoadingMessage("A carregar cartas...")

    try {
      // Usar uma query mais simples e fiável
      let url = "https://api.scryfall.com/cards/search?q=game:paper&unique=prints&order=released"
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 30 // Reduzir para evitar limites de taxa
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3

      while (url && pageCount < maxPages && consecutiveErrors < maxConsecutiveErrors) {
        // Verificar se foi cancelado
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Carregamento foi cancelado")
          return
        }

        pageCount++
        setLoadingMessage(`A carregar cartas (página ${pageCount}/${maxPages})...`)
        console.log(`A carregar página ${pageCount}`)

        try {
          // Atraso progressivo para evitar limites de taxa
          const delay = Math.min(200 + pageCount * 50, 1000)
          await new Promise((r) => setTimeout(r, delay))

          const response = await fetch(url, {
            signal: abortControllerRef.current.signal,
            headers: {
              Accept: "application/json",
              "User-Agent": "MTGCollectionManager/1.0",
            },
          })

          if (!response.ok) {
            if (response.status === 429) {
              // Limite de taxa - aguardar mais tempo
              console.log("Limite de taxa atingido, a aguardar 2 segundos...")
              await new Promise((r) => setTimeout(r, 2000))
              consecutiveErrors++
              continue
            } else if (response.status >= 500) {
              // Erro do servidor - tentar novamente
              console.log(`Erro do servidor (${response.status}), a tentar novamente...`)
              consecutiveErrors++
              await new Promise((r) => setTimeout(r, 1000))
              continue
            } else {
              throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
            }
          }

          const data = await response.json()

          if (!data.data || data.data.length === 0) {
            console.log("Nenhum dado retornado, a parar")
            break
          }

          // Filtrar cartas com imagens válidas
          const newCards = data.data.filter((c: MTGCard) => {
            return (
              c.image_uris?.normal ||
              c.card_faces?.[0]?.image_uris?.normal ||
              c.image_uris?.small ||
              c.card_faces?.[0]?.image_uris?.small
            )
          })

          cards = cards.concat(newCards)
          consecutiveErrors = 0 // Reiniciar contador de erros
          console.log(`Página ${pageCount}: ${newCards.length} cartas válidas, total: ${cards.length}`)

          // Verificar se há mais páginas
          if (!data.has_more || !data.next_page) {
            console.log("Não há mais páginas")
            break
          }

          url = data.next_page
        } catch (error: any) {
          if (error.name === "AbortError") {
            console.log("Requisição cancelada")
            return
          }

          consecutiveErrors++
          console.error(`Erro na página ${pageCount}:`, error.message)

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("Muitos erros consecutivos, a parar o carregamento")
            break
          }

          // Aguardar antes de tentar novamente
          const retryDelay = Math.min(1000 * consecutiveErrors, 5000)
          console.log(`A aguardar ${retryDelay}ms antes de tentar novamente...`)
          await new Promise((r) => setTimeout(r, retryDelay))
        }
      }

      // Verificar se foi cancelado antes de processar
      if (abortControllerRef.current?.signal.aborted) {
        console.log("Carregamento foi cancelado antes de processar")
        return
      }

      if (cards.length === 0) {
        console.log("Nenhuma carta foi carregada, a tentar fallback...")
        // Tentar uma query ainda mais simples
        try {
          const fallbackResponse = await fetch("https://api.scryfall.com/cards/search?q=*&page=1", {
            signal: abortControllerRef.current?.signal,
            headers: {
              Accept: "application/json",
              "User-Agent": "MTGCollectionManager/1.0",
            },
          })

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.data && fallbackData.data.length > 0) {
              cards = fallbackData.data.filter(
                (c: MTGCard) => c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal,
              )
              console.log(`Fallback carregou ${cards.length} cartas`)
            }
          }
        } catch (fallbackError) {
          console.error("Erro no fallback:", fallbackError)
        }
      }

      // Remover duplicatas baseado no ID
      const uniqueCards = cards.filter((card, index, self) => index === self.findIndex((c) => c.id === card.id))

      // Ordenar por data de lançamento (mais recente primeiro)
      const sortedCards = uniqueCards.sort(
        (a, b) => new Date(b.released_at || 0).getTime() - new Date(a.released_at || 0).getTime(),
      )

      console.log(`Carregamento concluído: ${sortedCards.length} cartas únicas de ${cards.length} cartas totais`)

      if (sortedCards.length > 0) {
        setAllCards(sortedCards)

        // Extrair opções de filtro
        const languages = Array.from(new Set(sortedCards.map((card) => card.lang).filter(Boolean))).sort()
        setAvailableLanguages(languages)

        const artists = Array.from(new Set(sortedCards.map((card) => card.artist).filter(Boolean))).sort()
        setAvailableArtists(artists)

        console.log(`${sortedCards.length} cartas carregadas com sucesso.`)

        // Mostrar estatísticas
        const rarityCount = sortedCards.reduce(
          (acc, card) => {
            acc[card.rarity] = (acc[card.rarity] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        console.log("Distribuição por raridade:", rarityCount)
      } else {
        console.warn("Nenhuma carta foi carregada")
        setLoadingMessage("Erro ao carregar cartas. Tente novamente.")
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Requisição cancelada")
        return
      }
      console.error("Erro geral no carregamento:", error)
      setLoadingMessage("Erro ao carregar cartas. Verifique a sua ligação.")
    } finally {
      setIsLoadingCards(false)
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [isLoadingCards]) // A dependência garante que não tentamos buscar de novo se já estiver buscando

  // Função para carregar cartas para o construtor de deck (todas as cartas)
  // FIX: Envolvida em useCallback
  const fetchDeckBuilderCards = useCallback(async () => {
    if (deckBuilderCards.length > 0) {
      console.log("Cartas do construtor de deck já carregadas")
      return
    }

    setIsSearchingCards(true)
    setLoadingMessage("A carregar cartas para o construtor de deck...")

    try {
      // Usar query mais específica para construção de deck (cartas únicas)
      let url = "https://api.scryfall.com/cards/search?q=game:paper&unique=cards&order=name"
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 25 // Limite menor para construtor de deck
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3

      while (url && pageCount < maxPages && consecutiveErrors < maxConsecutiveErrors) {
        pageCount++
        setLoadingMessage(`A carregar cartas para construtor de deck (${pageCount}/${maxPages})...`)
        console.log(`A carregar página ${pageCount} para construtor de deck`)

        try {
          // Atraso para evitar limites de taxa
          const delay = Math.min(300 + pageCount * 50, 1000)
          await new Promise((r) => setTimeout(r, delay))

          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
              "User-Agent": "MTGCollectionManager/1.0",
            },
          })

          if (!response.ok) {
            if (response.status === 429) {
              await new Promise((r) => setTimeout(r, 2000))
              consecutiveErrors++
              continue
            } else if (response.status >= 500) {
              consecutiveErrors++
              await new Promise((r) => setTimeout(r, 1000))
              continue
            } else {
              throw new Error(`HTTP error: ${response.status}`)
            }
          }

          const data = await response.json()

          if (!data.data || data.data.length === 0) {
            break
          }

          const newCards = data.data.filter(
            (c: MTGCard) => c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal,
          )

          cards = cards.concat(newCards)
          consecutiveErrors = 0
          console.log(`Página ${pageCount} do construtor de deck: ${newCards.length} cartas, total: ${cards.length}`)

          if (!data.has_more || !data.next_page) {
            break
          }

          url = data.next_page
        } catch (error: any) {
          consecutiveErrors++
          console.error(`Erro na página ${pageCount} do construtor de deck:`, error.message)

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("Muitos erros consecutivos no construtor de deck, a parar")
            break
          }

          const retryDelay = Math.min(1000 * consecutiveErrors, 3000)
          await new Promise((r) => setTimeout(r, retryDelay))
        }
      }

      // Remover duplicatas e ordenar
      const uniqueCards = cards
        .filter((card, index, self) => index === self.findIndex((c) => c.name === card.name))
        .sort((a, b) => a.name.localeCompare(b.name))

      setDeckBuilderCards(uniqueCards)
      console.log(`${uniqueCards.length} cartas únicas carregadas para o construtor de deck`)
    } catch (error) {
      console.error("Erro ao carregar cartas do construtor de deck:", error)
    } finally {
      setIsSearchingCards(false)
    }
  }, [deckBuilderCards.length]) // A dependência garante que não buscamos de novo se as cartas já estiverem carregadas

  const toggleColor = (color: string) => {
    const newActiveColors = new Set(activeColors)
    if (newActiveColors.has(color)) {
      newActiveColors.delete(color)
    } else {
      newActiveColors.add(color)
    }
    setActiveColors(newActiveColors)
  }

  const cycleColumns = () => {
    const currentIndex = columnOptions.indexOf(currentColumns)
    const nextIndex = (currentIndex + 1) % columnOptions.length
    setCurrentColumns(columnOptions[nextIndex])
  }

  const formatManaSymbols = (text: string) => {
    if (!text) return ""
    return text.replace(/\{([^}]+)\}/g, (match, symbol) => {
      const sanitized = symbol.replace("/", "")
      return `<img src="https://svgs.scryfall.io/card-symbols/${sanitized}.svg" alt="{${symbol}}" class="inline-block w-4 h-4 mx-px align-text-bottom">`
    })
  }

  // Aplicar filtros para a coleção
  const applyFilters = useCallback(() => {
    const filtered = allCards.filter((card) => {
      const owned = ownedCardsMap.has(card.id)

      // Ownership filter
      if (ownershipFilter === "owned" && !owned) return false
      if (ownershipFilter === "not-owned" && owned) return false

      // Hidden sets
      if (hiddenSets.has(card.set_name)) return false

      // Search filter
      if (searchQuery && !normalize(card.name).includes(normalize(searchQuery))) return false

      // Collection type filter
      if (collectionType && collectionType !== "all") {
        if (!normalize(card.type_line).includes(normalize(collectionType))) return false
      }

      // Advanced filters
      if (rarityFilter !== "all" && card.rarity !== rarityFilter) return false
      if (cmcFilter && card.cmc.toString() !== cmcFilter) return false
      if (powerFilter && card.power !== powerFilter) return false
      if (toughnessFilter && card.toughness !== toughnessFilter) return false
      if (artistFilter !== "all" && card.artist !== artistFilter) return false
      if (languageFilter !== "all" && card.lang !== languageFilter) return false
      if (oracleTextFilter && !normalize(card.oracle_text || "").includes(normalize(oracleTextFilter))) return false

      // Foil filter
      if (foilFilter === "foil" && !card.foil) return false
      if (foilFilter === "nonfoil" && !card.nonfoil) return false

      // Color filter
      if (activeColors.size < 6) {
        const cardColors = card.color_identity || []
        if (cardColors.length === 0) {
          if (!activeColors.has("C")) return false
        } else {
          if (!cardColors.some((c) => activeColors.has(c))) return false
        }
      }

      return true
    })

    // Sort - modificar a parte de ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'edition':
        default:
          const dateA = new Date(a.released_at || 0).getTime();
          const dateB = new Date(b.released_at || 0).getTime();
          // Mais recente primeiro por padrão
          comparison = dateB - dateA; 
          break;
      }

      return sortAscending ? comparison : -comparison;
    });

    setFilteredCards(filtered)
  }, [allCards, ownedCardsMap, ownershipFilter, hiddenSets, searchQuery, collectionType, rarityFilter, cmcFilter, powerFilter, toughnessFilter, artistFilter, languageFilter, oracleTextFilter, foilFilter, activeColors, sortBy, sortAscending])

  // Aplicar filtros para o construtor de deck
  const applyDeckFilters = useCallback(() => {
    if (!deckBuilderCards.length) return

    const filtered = deckBuilderCards.filter((card) => {
      // Search filter
      if (deckSearchQuery && !normalize(card.name).includes(normalize(deckSearchQuery))) return false

      // Advanced filters
      if (rarityFilter !== "all" && card.rarity !== rarityFilter) return false
      if (cmcFilter && card.cmc.toString() !== cmcFilter) return false
      if (powerFilter && card.power !== powerFilter) return false
      if (toughnessFilter && card.toughness !== toughnessFilter) return false

      // Color filter
      if (activeColors.size < 6) {
        const cardColors = card.color_identity || []
        if (cardColors.length === 0) {
          if (!activeColors.has("C")) return false
        } else {
          if (!cardColors.some((c) => activeColors.has(c))) return false
        }
      }

      return true
    })

    setFilteredDeckCards(filtered)
  }, [deckBuilderCards, deckSearchQuery, rarityFilter, cmcFilter, powerFilter, toughnessFilter, activeColors])

  // Função para buscar regras da carta
  const fetchCardRulings = async (card: MTGCard) => {
    setIsLoadingRulings(true)
    setCardRulings([])
    
    try {
      // Primeiro, tentar buscar rulings da API do Scryfall
      const rulingsResponse = await fetch(`https://api.scryfall.com/cards/${card.id}/rulings`)
      
      if (rulingsResponse.ok) {
        const rulingsData = await rulingsResponse.json()
        if (rulingsData.data && rulingsData.data.length > 0) {
          setCardRulings(rulingsData.data)
        } else {
          // Se não há rulings no Scryfall, usar uma mensagem padrão
          setCardRulings([{
            source: "scryfall",
            published_at: card.released_at,
            comment: "Nenhuma regra específica encontrada para esta carta. Consulte as regras gerais do Magic."
          }])
        }
      } else {
        throw new Error("Falha ao buscar regras")
      }
    } catch (error) {
      console.error("Erro ao buscar regras:", error)
      setCardRulings([{
        source: "error",
        published_at: new Date().toISOString(),
        comment: "Erro ao carregar regras. Tente novamente mais tarde."
      }])
    } finally {
      setIsLoadingRulings(false)
    }
  }

  // Função para carregar cartas da coleção selecionada
  const loadCardsFromCollection = (collectionId: string) => {
    const collection = savedCollections.find(c => c.id === collectionId)
    if (collection) {
      const cards = collection.cards.map(cc => cc.card)
      setAvailableRulesCards(cards)
    }
  }

  // Função para carregar cartas do deck selecionado
  const loadCardsFromDeck = (deckId: string) => {
    const deck = savedDecks.find(d => d.id === deckId)
    if (deck) {
      const allCards = [
        ...deck.mainboard.map(dc => dc.card),
        ...deck.sideboard.map(dc => dc.card)
      ]
      if (deck.commander) {
        allCards.push(deck.commander.card)
      }
      // Remover duplicatas
      const uniqueCards = allCards.filter((card, index, self) => 
        index === self.findIndex(c => c.id === card.id)
      )
      setAvailableRulesCards(uniqueCards)
    }
  }

  // Carregar cartas automaticamente quando o componente monta
  useEffect(() => {
    if (allCards.length === 0) {
        fetchGeneralCards()
    }
  }, [fetchGeneralCards, allCards.length]) // A dependência em allCards.length previne re-fetches desnecessários

  // Carregar cartas do construtor de deck quando a aba é acedida
  // FIX: Adicionadas as dependências em falta
  useEffect(() => {
    if (activeTab === "deckbuilder" && deckBuilderCards.length === 0) {
      fetchDeckBuilderCards()
    }
  }, [activeTab, deckBuilderCards.length, fetchDeckBuilderCards])

  // Efeito para aplicar filtros quando dados mudam
  useEffect(() => {
    if (allCards.length > 0) {
      applyFilters()
    }
  }, [allCards, applyFilters]) // applyFilters já é memoizado, então não precisamos listar suas dependências aqui

  // Efeito para aplicar filtros ao construtor de deck
  useEffect(() => {
    if (deckBuilderCards.length > 0) {
      applyDeckFilters()
    }
  }, [deckBuilderCards, applyDeckFilters]) // applyDeckFilters já é memoizado

  // Efeito para atualizar cartas disponíveis quando a fonte muda
  useEffect(() => {
    if (rulesSource === "collection" && selectedCollectionForRules) {
      loadCardsFromCollection(selectedCollectionForRules)
    } else if (rulesSource === "deck" && selectedDeckForRules) {
      loadCardsFromDeck(selectedDeckForRules)
    } else if (rulesSource === "search") {
      setAvailableRulesCards([])
    }
  }, [rulesSource, selectedCollectionForRules, selectedDeckForRules, savedCollections, savedDecks])

  // Limpeza ao desmontar componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const stats = {
    total: allCards.length,
    ownedArtworks: ownedCardsMap.size,
    totalCopies: Array.from(ownedCardsMap.values()).reduce(
      (sum, card) => sum + Number.parseInt(card.originalEntry.Quantity || "1", 10),
      0,
    ),
    missing: allCards.length - ownedCardsMap.size,
  }

  const visibleCards = filteredCards.slice(0, visibleCount)
  const visibleDeckCards = filteredDeckCards.slice(0, visibleCount)

  const groupedCards = useMemo(() => visibleCards.reduce(
    (acc, card) => {
      const set = card.set_name || "Sem Edição"
      if (!acc[set]) acc[set] = []
      acc[set].push(card)
      return acc
    },
    {} as Record<string, MTGCard[]>,
  ), [visibleCards]);

  // Classes padrão para inputs e seleções
  const inputClasses =
    "bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
  const selectClasses = "bg-gray-900 border-gray-600 text-white focus:ring-emerald-500 focus:border-emerald-500"

  // Mapas de cores para gráficos
  const colorMap = {
    W: "#fffbd5",
    U: "#0e68ab",
    B: "#150b00",
    R: "#d3202a",
    G: "#00733e",
    C: "#ccc2c0",
  }

  const rarityColorMap = {
    common: "#6b7280", // gray-500
    uncommon: "#d1d5db", // gray-300
    rare: "#f59e0b", // amber-500
    mythic: "#ef4444", // red-500
  }
  
  // FIX: Mapear o número de colunas para uma classe Tailwind válida para garantir que a compilação JIT funcione.
  const gridColsClass = useMemo(() => {
    switch(currentColumns) {
      case 3: return "grid-cols-3";
      case 5: return "grid-cols-5";
      case 7: return "grid-cols-7";
      default: return "grid-cols-7";
    }
  }, [currentColumns]);
  
  // Otimização para a lista de artistas e idiomas
  const memoizedAvailableArtists = useMemo(() => availableArtists.slice(0, 100), [availableArtists]);

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: `url("${backgroundImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "blur(4px) brightness(0.6)",
            }}
          />
          <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900/70 via-blue-900/70 to-purple-900/70" />
        </>
      )}

      {/* Fallback background se não houver imagem */}
      {!backgroundImage && (
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900" />
      )}

      {/* Main Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              {/* Logo e título */}
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-white">Gerenciador de Coleção MTG</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRandomBackground}
                  disabled={isLoadingBackground}
                  className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 backdrop-blur-sm"
                  title="Trocar imagem de fundo"
                >
                  {isLoadingBackground ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                </Button>
              </div>

              {/* Seção de Utilizador */}
              <div className="flex items-center gap-4">
                {isAuthenticated && currentUser ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white font-medium">{currentUser.name}</p>
                      <p className="text-gray-400 text-sm">{currentUser.email}</p>
                    </div>
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full border-2 border-emerald-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProfileDialog(true)}
                      className="bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Perfil
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="bg-red-600/20 border-red-500 text-red-400 hover:bg-red-600/30"
                    >
                      Sair
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowLoginDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2"
                  >
                    Entrar
                  </Button>
                )}
              </div>
            </div>

            {isLoadingBackground && <p className="text-xs text-gray-400 mt-1">A carregar nova imagem...</p>}
            {backgroundImage && !isLoadingBackground && <p className="text-xs text-gray-500 mt-1">Background ativo</p>}
            <p className="text-gray-300">Gerencie a sua coleção de Magic: The Gathering</p>
          </div>

          {/* Navegação de separadores */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            
<TabsList className="grid w-full grid-cols-4 bg-gray-800/70 border-gray-700 backdrop-blur-sm mb-4 sm:mb-6">
  <TabsTrigger
    value="collection"
    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300"
  >
    <Library className="w-4 h-4 mr-2" />
    Coleção
  </TabsTrigger>
  <TabsTrigger
    value="dashboard"
    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300"
  >
    <BarChart3 className="w-4 h-4 mr-2" />
    Painel de controlo
  </TabsTrigger>
  <TabsTrigger
    value="deckbuilder"
    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300"
  >
    <Hammer className="w-4 h-4 mr-2" />
    Construtor de baralhos
  </TabsTrigger>
  <TabsTrigger
    value="rules"
    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300"
  >
    <FileText className="w-4 h-4 mr-2" />
    Regras
  </TabsTrigger>
</TabsList>

            {/* Separador da Coleção */}
            <TabsContent value="collection" className="space-y-6">
              {/* Cabeçalho da Coleção */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Lado esquerdo - Informações da Coleção */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Nome da coleção"
                          value={currentCollection.name}
                          onChange={(e) =>
                            setCurrentCollection((prev) => ({
                              ...prev,
                              name: e.target.value,
                              updatedAt: new Date().toISOString(),
                            }))
                          }
                          className={`${inputClasses} text-2xl font-bold bg-transparent border-none p-0 h-auto`}
                        />
                        <Badge variant="outline" className="border-purple-500 text-purple-400 px-3 py-1">
                          {currentCollection.cards.length} cartas
                        </Badge>
                      </div>

                      <Textarea
                        placeholder="Descrição da coleção..."
                        value={currentCollection.description || ""}
                        onChange={(e) => setCurrentCollection((prev) => ({ ...prev, description: e.target.value }))}
                        className={`${inputClasses} bg-transparent border-none p-0 resize-none`}
                        rows={2}
                      />

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Cartas: {dashboardStats.uniqueCards}</span>
                        <span>•</span>
                        <span>Valor: R$ {dashboardStats.totalValue.toFixed(2)}</span>
                        <span>•</span>
                        <span>Cópias: {dashboardStats.totalCopies}</span>
                      </div>
                    </div>

                    {/* Lado direito - Ações */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={newCollection}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        Nova
                      </Button>

                      <Dialog open={showSaveCollectionDialog} onOpenChange={setShowSaveCollectionDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Coleção
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Guardar Coleção</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Nome da Coleção</label>
                              <Input
                                value={currentCollection.name}
                                onChange={(e) => setCurrentCollection((prev) => ({ ...prev, name: e.target.value }))}
                                className={inputClasses}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Descrição (Opcional)</label>
                              <Textarea
                                value={currentCollection.description || ""}
                                onChange={(e) =>
                                  setCurrentCollection((prev) => ({ ...prev, description: e.target.value }))
                                }
                                className={inputClasses}
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setShowSaveCollectionDialog(false)}
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                              >
                                Cancelar
                              </Button>
                              <Button onClick={saveCollection} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showLoadCollectionDialog} onOpenChange={setShowLoadCollectionDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-600 border-green-500 text-white hover:bg-green-700"
                            disabled={savedCollections.length === 0}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Carregar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Coleções Guardadas</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {savedCollections.length === 0 ? (
                              <p className="text-gray-400 text-center py-4">Nenhuma coleção guardada ainda.</p>
                            ) : (
                              savedCollections.map((collection) => (
                                <div key={collection.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="text-white font-medium mb-1">{collection.name}</h3>
                                      <p className="text-sm text-gray-400 mb-2">
                                        <strong>Cartas:</strong> {collection.cards.length} • <strong>Criado:</strong>{" "}
                                        {new Date(collection.createdAt).toLocaleDateString("pt-PT")}
                                      </p>
                                      {collection.description && (
                                        <p className="text-xs text-gray-500">{collection.description}</p>
                                      )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                      <Button
                                        size="sm"
                                        onClick={() => loadCollection(collection)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        Carregar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteCollection(collection.id)}
                                        className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                        disabled={loading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar CSV
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Procurar e Filtros Básicos */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    <div className="flex-1 min-w-48">
                      <Input
                        placeholder="Procurar cartas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className={`w-32 ${selectClasses}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="edition" className="text-white">
                          Edição
                        </SelectItem>
                        <SelectItem value="name" className="text-white">
                          Nome
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortAscending(!sortAscending)}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      {sortAscending ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="flex justify-center mt-4 gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-white hover:text-gray-200 hover:bg-gray-700"
                    >
                      {showAdvancedFilters ? "Ocultar" : "Mostrar"} Filtros Avançados
                      {showAdvancedFilters ? (
                        <ChevronUp className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-2" />
                      )}
                    </Button>

                    {/* Botões para gerenciar filtros guardados */}
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Filtros
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Guardar Filtros Atuais</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Nome do Filtro</label>
                            <Input
                              placeholder="Ex: Elfos Raros, Dragões Vermelhos..."
                              value={filterName}
                              onChange={(e) => setFilterName(e.target.value)}
                              className={inputClasses}
                            />
                          </div>
                          <div className="text-sm text-gray-400">
                            <p>
                              <strong>Tipo:</strong> {collectionType || "Todos"}
                            </p>
                            <p>
                              <strong>Procurar:</strong> {searchQuery || "Nenhuma"}
                            </p>
                            <p>
                              <strong>Filtros ativos:</strong>{" "}
                              {[
                                ownershipFilter !== "all" && `Posse: ${ownershipFilter}`,
                                rarityFilter !== "all" && `Raridade: ${rarityFilter}`,
                                cmcFilter && `CMC: ${cmcFilter}`,
                                foilFilter !== "all" && `Foil: ${foilFilter}`,
                                activeColors.size < 6 && `Cores: ${Array.from(activeColors).join(", ")}`,
                              ]
                                .filter(Boolean)
                                .join(", ") || "Nenhum"}
                            </p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setShowSaveDialog(false)}
                              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                              Cancelar
                            </Button>
                            <Button onClick={saveCurrentFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                              Guardar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-600 border-green-500 text-white hover:bg-green-700"
                          disabled={savedFilters.length === 0}
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Carregar Filtros ({savedFilters.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">Filtros Guardados</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {savedFilters.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Nenhum filtro guardado ainda.</p>
                          ) : (
                            savedFilters.map((filter) => (
                              <div key={filter.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-white font-medium mb-1">{filter.name}</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                      <strong>Tipo:</strong> {filter.collectionType} •<strong> Criado:</strong>{" "}
                                      {new Date(filter.createdAt).toLocaleDateString("pt-PT")}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                      {filter.filters.searchQuery && (
                                        <span>Procurar: "{filter.filters.searchQuery}" • </span>
                                      )}
                                      {filter.filters.ownershipFilter !== "all" && (
                                        <span>Posse: {filter.filters.ownershipFilter} • </span>
                                      )}
                                      {filter.filters.rarityFilter !== "all" && (
                                        <span>Raridade: {filter.filters.rarityFilter} • </span>
                                      )}
                                      {filter.filters.cmcFilter && <span>CMC: {filter.filters.cmcFilter} • </span>}
                                      {filter.filters.foilFilter !== "all" && (
                                        <span>Foil: {filter.filters.foilFilter} • </span>
                                      )}
                                      {filter.filters.activeColors.length < 6 && (
                                        <span>Cores: {filter.filters.activeColors.join(", ")}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button
                                      size="sm"
                                      onClick={() => loadSavedFilter(filter)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Carregar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteSavedFilter(filter.id)}
                                      className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {showAdvancedFilters && (
                <Card className="bg-gray-800/90 border-gray-600 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Filtros de cor */}
                      <div>
                        <label className="text-sm font-semibold text-white mb-3 block">Filtro por Cores</label>
                        <div className="flex gap-2 justify-center flex-wrap">
                          {[
                            { color: "W", name: "Branco" },
                            { color: "U", name: "Azul" },
                            { color: "B", name: "Preto" },
                            { color: "R", name: "Vermelho" },
                            { color: "G", name: "Verde" },
                            { color: "C", name: "Incolor" },
                          ].map(({ color, name }) => (
                            <Button
                              key={color}
                              variant={activeColors.has(color) ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleColor(color)}
                              className={`${
                                activeColors.has(color)
                                  ? "bg-emerald-600 text-white border-emerald-500"
                                  : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                              }`}
                            >
                              {name}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Filtro de tipo de coleção */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Tipo de Coleção</label>
                          <Select value={collectionType} onValueChange={setCollectionType}>
                            <SelectTrigger className={selectClasses}>
                              <SelectValue placeholder="Selecionar tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="all" className="text-white">
                                Todas as Cartas
                              </SelectItem>
                              {cardTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="text-white">
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Raridade</label>
                          <Select value={rarityFilter} onValueChange={setRarityFilter}>
                            <SelectTrigger className={selectClasses}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="all" className="text-white">
                                Todas
                              </SelectItem>
                              <SelectItem value="common" className="text-white">
                                Comum
                              </SelectItem>
                              <SelectItem value="uncommon" className="text-white">
                                Incomum
                              </SelectItem>
                              <SelectItem value="rare" className="text-white">
                                Rara
                              </SelectItem>
                              <SelectItem value="mythic" className="text-white">
                                Mítica
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">CMC</label>
                          <Input
                            placeholder="Ex: 3"
                            value={cmcFilter}
                            onChange={(e) => setCmcFilter(e.target.value)}
                            className={inputClasses}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Poder</label>
                          <Input
                            placeholder="Ex: 2"
                            value={powerFilter}
                            onChange={(e) => setPowerFilter(e.target.value)}
                            className={inputClasses}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Resistência</label>
                          <Input
                            placeholder="Ex: 3"
                            value={toughnessFilter}
                            onChange={(e) => setToughnessFilter(e.target.value)}
                            className={inputClasses}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-white mb-2 block">Foil</label>
                          <Select value={foilFilter} onValueChange={setFoilFilter}>
                            <SelectTrigger className={selectClasses}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="all" className="text-white">
                                Todas
                              </SelectItem>
                              <SelectItem value="foil" className="text-white">
                                Apenas Foil
                              </SelectItem>
                              <SelectItem value="nonfoil" className="text-white">
                                Apenas Não-Foil
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {availableLanguages.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Idioma</label>
                            <Select value={languageFilter} onValueChange={setLanguageFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="all" className="text-white">
                                  Todas
                                </SelectItem>
                                {availableLanguages.map((lang) => (
                                  <SelectItem key={lang} value={lang} className="text-white">
                                    {lang?.toUpperCase() || lang}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {memoizedAvailableArtists.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Artista</label>
                            <Select value={artistFilter} onValueChange={setArtistFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                                <SelectItem value="all" className="text-white">
                                  Todos
                                </SelectItem>
                                {memoizedAvailableArtists.map((artist) => (
                                  <SelectItem key={artist} value={artist} className="text-white">
                                    {artist}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="text-sm font-medium text-white mb-2 block">Texto do Oráculo</label>
                          <Input
                            placeholder="Ex: voar, atropelar, vigilância..."
                            value={oracleTextFilter}
                            onChange={(e) => setOracleTextFilter(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado de Carregamento */}
              {(loading || isLoadingCards) && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-white text-lg">{loadingMessage}</p>
                      <Button
                        variant="outline"
                        onClick={cancelLoading}
                        className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Layout de Duas Colunas */}
              {!loading && !isLoadingCards && allCards.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Todas as Cartas */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-xl">Todas as Cartas ({filteredCards.length})</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTextView(!textView)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            {textView ? <Grid3X3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </Button>
                          {!textView && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cycleColumns}
                              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                            >
                              <Grid3X3 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-[800px] overflow-y-auto">
                      {filteredCards.length > 0 ? (
                        <div className="space-y-4">
                          {textView ? (
                            // Vista de Texto
                            <div className="space-y-2">
                              {visibleCards.map((card) => {
                                const quantityInCollection = getCardQuantityInCollection(card.id, false)
                                const quantityInCollectionFoil = getCardQuantityInCollection(card.id, true)

                                return (
                                  <div
                                    key={card.id}
                                    className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                                  >
                                    <img
                                      src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                                      alt={card.name}
                                      className="w-12 h-16 rounded object-cover cursor-pointer"
                                      onClick={() => setSelectedCard(card)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">{card.name}</p>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="text-xs"
                                          dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                                        />
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            card.rarity === "mythic"
                                              ? "border-orange-500 text-orange-400"
                                              : card.rarity === "rare"
                                                ? "border-yellow-500 text-yellow-400"
                                                : card.rarity === "uncommon"
                                                  ? "border-gray-400 text-gray-300"
                                                  : "border-gray-600 text-gray-400"
                                          }`}
                                        >
                                          {card.rarity.charAt(0).toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-400 text-xs truncate">{card.set_name}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          onClick={() => addCardToCollection(card, 1, "Near Mint", false)}
                                          className="w-6 h-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                          title="Adicionar Normal"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                        {quantityInCollection > 0 && (
                                          <>
                                            <span className="text-white text-xs font-medium w-6 text-center">
                                              {quantityInCollection}
                                            </span>
                                            <Button
                                              size="sm"
                                              onClick={() => removeCardFromCollection(card.id, false, 1)}
                                              className="w-6 h-6 p-0 bg-red-600 hover:bg-red-700 text-white text-xs"
                                              title="Remover Normal"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          onClick={() => addCardToCollection(card, 1, "Near Mint", true)}
                                          className="w-6 h-6 p-0 bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                                          title="Adicionar Foil"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                        {quantityInCollectionFoil > 0 && (
                                          <>
                                            <span className="text-white text-xs font-medium w-6 text-center">
                                              {quantityInCollectionFoil}
                                            </span>
                                            <Button
                                              size="sm"
                                              onClick={() => removeCardFromCollection(card.id, true, 1)}
                                              className="w-6 h-6 p-0 bg-red-600 hover:bg-red-700 text-white text-xs"
                                              title="Remover Foil"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            // Vista de Grelha
                            <div className={`grid ${gridColsClass} gap-2`}>
                              {visibleCards.map((card) => {
                                const quantityInCollection = getCardQuantityInCollection(card.id, false)
                                const quantityInCollectionFoil = getCardQuantityInCollection(card.id, true)

                                return (
                                  <div
                                    key={card.id}
                                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                    onClick={() => setSelectedCard(card)}
                                  >
                                    <div className="relative">
                                      <img
                                        src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                                        alt={card.name}
                                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                        loading="lazy"
                                      />
                                      {(quantityInCollection > 0 || quantityInCollectionFoil > 0) && (
                                        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1 pointer-events-none">
                                          <CheckCircle className="w-4 h-4" />
                                        </div>
                                      )}
                                      {quantityInCollection > 0 && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold pointer-events-none">
                                          {quantityInCollection}
                                        </div>
                                      )}
                                      {quantityInCollectionFoil > 0 && (
                                        <div className="absolute bottom-2 left-2 bg-yellow-600 text-white rounded-full px-2 py-1 text-xs font-bold pointer-events-none">
                                          F{quantityInCollectionFoil}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Botões de adicionar/remover, visíveis ao passar o rato */}
                                    <div className="absolute bottom-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      {/* FIX: Adicionado stopPropagation para impedir que o modal abra ao clicar */}
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          addCardToCollection(card, 1, "Near Mint", false)
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 h-6 w-6"
                                        title="Adicionar Normal"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          addCardToCollection(card, 1, "Near Mint", true)
                                        }}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white p-1 h-6 w-6"
                                        title="Adicionar Foil"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Botão Carregar Mais */}
                          {visibleCount < filteredCards.length && (
                            <div className="text-center pt-4">
                              <Button
                                onClick={() => setVisibleCount((prev) => prev + 25)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Carregar Mais ({filteredCards.length - visibleCount} restantes)
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg">Nenhuma carta encontrada com os filtros atuais.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Coluna Direita - A Minha Coleção */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-xl">
                          A Minha Coleção ({currentCollection.cards.length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                            {dashboardStats.totalCopies} cópias
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="max-h-[800px] overflow-y-auto">
                      {currentCollection.cards.length > 0 ? (
                        <div className="space-y-4">
                          {textView ? (
                            // Vista de Texto
                            <div className="space-y-2">
                              {currentCollection.cards
                                .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
                                .map((collectionCard) => (
                                  <div
                                    key={`${collectionCard.card.id}-${collectionCard.foil}`}
                                    className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                                  >
                                    <img
                                      src={getOptimizedImageUrl(collectionCard.card, true) || "/placeholder.svg"}
                                      alt={collectionCard.card.name}
                                      className="w-12 h-16 rounded object-cover cursor-pointer"
                                      onClick={() => setSelectedCard(collectionCard.card)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">
                                        {collectionCard.card.name}
                                        {collectionCard.foil && (
                                          <span className="ml-2 text-yellow-400 text-xs">(Foil)</span>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="text-xs"
                                          dangerouslySetInnerHTML={{
                                            __html: formatManaSymbols(collectionCard.card.mana_cost || ""),
                                          }}
                                        />
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            collectionCard.card.rarity === "mythic"
                                              ? "border-orange-500 text-orange-400"
                                              : collectionCard.card.rarity === "rare"
                                                ? "border-yellow-500 text-yellow-400"
                                                : collectionCard.card.rarity === "uncommon"
                                                  ? "border-gray-400 text-gray-300"
                                                  : "border-gray-600 text-gray-400"
                                          }`}
                                        >
                                          {collectionCard.card.rarity.charAt(0).toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-400 text-xs truncate">
                                        {collectionCard.card.set_name} • {collectionCard.condition}
                                      </p>
                                      <p className="text-gray-500 text-xs">
                                        R$ {(getEstimatedPrice(collectionCard.card) * collectionCard.quantity).toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          removeCardFromCollection(collectionCard.card.id, collectionCard.foil, 1)
                                        }
                                        className="w-6 h-6 p-0 bg-red-600 hover:bg-red-700 text-white text-xs"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-white text-sm font-medium w-8 text-center">
                                        {collectionCard.quantity}
                                      </span>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          addCardToCollection(
                                            collectionCard.card,
                                            1,
                                            collectionCard.condition,
                                            collectionCard.foil,
                                          )
                                        }
                                        className="w-6 h-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          removeCardFromCollection(
                                            collectionCard.card.id,
                                            collectionCard.foil,
                                            collectionCard.quantity,
                                          )
                                        }
                                        className="w-6 h-6 p-0 bg-gray-600 hover:bg-gray-700 text-white text-xs ml-2"
                                        title="Remover todas"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            // Vista de Grelha
                            <div className={`grid ${gridColsClass} gap-2`}>
                              {currentCollection.cards
                                .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
                                .map((collectionCard) => (
                                  <div
                                    key={`${collectionCard.card.id}-${collectionCard.foil}`}
                                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                    onClick={() => setSelectedCard(collectionCard.card)}
                                  >
                                    <div className="relative">
                                      <img
                                        src={getOptimizedImageUrl(collectionCard.card, true) || "/placeholder.svg"}
                                        alt={collectionCard.card.name}
                                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                        loading="lazy"
                                      />
                                      <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1 pointer-events-none">
                                        <CheckCircle className="w-4 h-4" />
                                      </div>
                                      <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold pointer-events-none">
                                        {collectionCard.quantity}
                                      </div>
                                      {collectionCard.foil && (
                                        <div className="absolute bottom-2 left-2 bg-yellow-600 text-white rounded-full px-2 py-1 text-xs font-bold pointer-events-none">
                                          FOIL
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Botões de adicionar/remover, visíveis ao passar o rato */}
                                    <div className="absolute bottom-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          addCardToCollection(
                                            collectionCard.card,
                                            1,
                                            collectionCard.condition,
                                            collectionCard.foil,
                                          )
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 h-6 w-6"
                                        title="Adicionar"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          removeCardFromCollection(collectionCard.card.id, collectionCard.foil, 1)
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white p-1 h-6 w-6"
                                        title="Remover"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg mb-2">A sua coleção está vazia</p>
                          <p className="text-gray-500 text-sm">
                            Use os botões <Plus className="w-4 h-4 inline mx-1" /> na coluna da esquerda para adicionar
                            cartas
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Nenhuma carta carregada */}
              {!loading && !isLoadingCards && allCards.length === 0 && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400 text-lg mb-4">Nenhuma carta carregada ainda.</p>
                    <Button onClick={fetchGeneralCards} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Carregar Cartas
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Separador do Painel de controlo */}
            <TabsContent value="dashboard" className="space-y-6">
              {currentCollection.cards.length === 0 ? (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400 text-lg mb-4">Monte a sua coleção para ver estatísticas detalhadas.</p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("collection")}
                      className="bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700"
                    >
                      Ir para Coleção
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Estatísticas gerais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Library className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-3xl font-bold text-blue-400">{dashboardStats.uniqueCards}</p>
                        <p className="text-sm text-gray-400">Cartas Únicas</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Copy className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-3xl font-bold text-purple-400">{dashboardStats.totalCopies}</p>
                        <p className="text-sm text-gray-400">Total de Cópias</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Coins className="w-8 h-8 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-400">R$ {dashboardStats.totalValue.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">Valor Estimado</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-3xl font-bold text-green-400">
                          R${" "}
                          {dashboardStats.totalCopies > 0
                            ? (dashboardStats.totalValue / dashboardStats.totalCopies).toFixed(2)
                            : "0.00"}
                        </p>
                        <p className="text-sm text-gray-400">Valor Médio/Cópia</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SimpleBarChart
                      data={dashboardStats.colorDistribution}
                      title="Distribuição por Cores"
                      colorMap={colorMap}
                    />

                    <SimpleBarChart
                      data={dashboardStats.rarityDistribution}
                      title="Distribuição por Raridade"
                      colorMap={rarityColorMap}
                    />

                    <SimpleBarChart
                      data={Object.fromEntries(
                        Object.entries(dashboardStats.typeDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 8),
                      )}
                      title="Tipos Mais Comuns"
                    />

                    <SimpleBarChart
                      data={dashboardStats.cmcDistribution}
                      title="Curva de Mana (CMC)"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Separador do Construtor de Baralhos */}
            <TabsContent value="deckbuilder" className="space-y-6">
              {/* Cabeçalho do Baralho */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Lado esquerdo - Informações do Baralho */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Nome do baralho"
                          value={currentDeck.name}
                          onChange={(e) =>
                            setCurrentDeck((prev) => ({
                              ...prev,
                              name: e.target.value,
                              updatedAt: new Date().toISOString(),
                            }))
                          }
                          className={`${inputClasses} text-2xl font-bold bg-transparent border-none p-0 h-auto`}
                        />
                        <Badge variant="outline" className="border-purple-500 text-purple-400 px-3 py-1">
                          {currentDeck.format.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Formato: {currentDeck.format}</span>
                        <span>•</span>
                        <span>Cartas: {deckStats.totalCards}</span>
                        <span>•</span>
                        <span>Valor: R$ {deckStats.totalValue.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Lado direito - Ações */}
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={currentDeck.format}
                        onValueChange={(format) =>
                          setCurrentDeck((prev) => ({ ...prev, format, updatedAt: new Date().toISOString() }))
                        }
                      >
                        <SelectTrigger className={`w-32 ${selectClasses}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="standard" className="text-white">
                            Padrão
                          </SelectItem>
                          <SelectItem value="modern" className="text-white">
                            Moderno
                          </SelectItem>
                          <SelectItem value="legacy" className="text-white">
                            Legado
                          </SelectItem>
                          <SelectItem value="vintage" className="text-white">
                            Vintage
                          </SelectItem>
                          <SelectItem value="commander" className="text-white">
                            Comandante
                          </SelectItem>
                          <SelectItem value="pioneer" className="text-white">
                            Pioneiro
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={newDeck}
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      >
                        Novo
                      </Button>

                      <Dialog open={showDeckSaveDialog} onOpenChange={setShowDeckSaveDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Guardar Baralho</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Nome do Baralho</label>
                              <Input
                                value={currentDeck.name}
                                onChange={(e) => setCurrentDeck((prev) => ({ ...prev, name: e.target.value }))}
                                className={inputClasses}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Descrição (Opcional)</label>
                              <Textarea
                                value={currentDeck.description || ""}
                                onChange={(e) => setCurrentDeck((prev) => ({ ...prev, description: e.target.value }))}
                                className={inputClasses}
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setShowDeckSaveDialog(false)}
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                              >
                                Cancelar
                              </Button>
                              <Button onClick={saveDeck} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showDeckLoadDialog} onOpenChange={setShowDeckLoadDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-600 border-green-500 text-white hover:bg-green-700"
                            disabled={savedDecks.length === 0}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Carregar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Baralhos Guardados</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {savedDecks.length === 0 ? (
                              <p className="text-gray-400 text-center py-4">Nenhum baralho guardado ainda.</p>
                            ) : (
                              savedDecks.map((deck) => (
                                <div key={deck.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="text-white font-medium mb-1">{deck.name}</h3>
                                      <p className="text-sm text-gray-400 mb-2">
                                        <strong>Formato:</strong> {deck.format.toUpperCase()} • <strong>Cartas:</strong>{" "}
                                        {deck.mainboard.reduce((sum, card) => sum + card.quantity, 0)} •{" "}
                                        <strong>Criado:</strong> {new Date(deck.createdAt).toLocaleDateString("pt-PT")}
                                                                              </p>
                                      {deck.description && <p className="text-xs text-gray-500">{deck.description}</p>}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                      <Button
                                        size="sm"
                                        onClick={() => loadDeck(deck)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        Carregar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => deleteDeck(deck.id)}
                                        className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Importar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Importar Lista de Baralho</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">
                                Cole a sua lista de baralho aqui:
                              </label>
                              <Textarea
                                placeholder={`Exemplo:
4 Lightning Bolt
2 Counterspell
1 Black Lotus

// Sideboard
3 Negate
2 Dispel`}
                                value={deckImportText}
                                onChange={(e) => setDeckImportText(e.target.value)}
                                className={inputClasses}
                                rows={10}
                              />
                            </div>
                            <div className="text-xs text-gray-400">
                              <p>
                                <strong>Formato aceite:</strong> Quantidade Nome da Carta (ex: "4 Lightning Bolt")
                              </p>
                              <p>Use "// Sideboard" ou "Sideboard:" para separar o sideboard</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setShowImportDialog(false)}
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => importDeckFromText(deckImportText)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                disabled={!deckImportText.trim()}
                              >
                                Importar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const deckText = exportDeckToText()
                          navigator.clipboard.writeText(deckText)
                          // Substituir por um toast/notificação mais elegante
                          alert("Lista do baralho copiada para a área de transferência!");
                        }}
                        className="bg-orange-600 border-orange-500 text-white hover:bg-orange-700"
                        disabled={currentDeck.mainboard.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Procurar Baralho */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-48">
                      <Input
                        placeholder="Procurar cartas para adicionar ao baralho..."
                        value={deckSearchQuery}
                        onChange={(e) => setDeckSearchQuery(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    {/* Filtros básicos para construtor de baralhos */}
                    <Select value={rarityFilter} onValueChange={setRarityFilter}>
                      <SelectTrigger className={`w-32 ${selectClasses}`}>
                        <SelectValue placeholder="Raridade" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="all" className="text-white">
                          Todas
                        </SelectItem>
                        <SelectItem value="common" className="text-white">
                          Comum
                        </SelectItem>
                        <SelectItem value="uncommon" className="text-white">
                          Incomum
                        </SelectItem>
                        <SelectItem value="rare" className="text-white">
                          Rara
                        </SelectItem>
                        <SelectItem value="mythic" className="text-white">
                          Mítica
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="CMC"
                      value={cmcFilter}
                      onChange={(e) => setCmcFilter(e.target.value)}
                      className={`w-20 ${inputClasses}`}
                    />
                  </div>

                  {/* Filtros de cor para construtor de baralhos */}
                  <div className="flex gap-2 justify-center flex-wrap mt-4">
                    {[
                      { color: "W", name: "Branco" },
                      { color: "U", name: "Azul" },
                      { color: "B", name: "Preto" },
                      { color: "R", name: "Vermelho" },
                      { color: "G", name: "Verde" },
                      { color: "C", name: "Incolor" },
                    ].map(({ color, name }) => (
                      <Button
                        key={color}
                        variant={activeColors.has(color) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleColor(color)}
                        className={`${
                          activeColors.has(color)
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                        }`}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Layout de Três Colunas para o Construtor de Baralhos */}
              {!isSearchingCards && deckBuilderCards.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Coluna Esquerda - Cartas Disponíveis */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">
                          Cartas Disponíveis ({filteredDeckCards.length})
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTextView(!textView)}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          {textView ? <Grid3X3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                      {filteredDeckCards.length > 0 ? (
                        <div className="space-y-2">
                          {textView ? (
                            // Vista de Lista (atual)
                            <div className="space-y-2">
                              {visibleDeckCards.map((card) => (
                                <div
                                  key={card.id}
                                  className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                                  >
                                  <img
                                    src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                                    alt={card.name}
                                    className="w-10 h-14 rounded object-cover cursor-pointer"
                                    onClick={() => setSelectedCard(card)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{card.name}</p>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="text-xs"
                                        dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                                      />
                                      <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                          card.rarity === "mythic"
                                            ? "border-orange-500 text-orange-400"
                                            : card.rarity === "rare"
                                              ? "border-yellow-500 text-yellow-400"
                                              : card.rarity === "uncommon"
                                                  ? "border-gray-400 text-gray-300"
                                                  : "border-gray-600 text-gray-400"
                                        }`}
                                      >
                                        {card.rarity.charAt(0).toUpperCase()}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-400 text-xs truncate">{card.set_name}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => addCardToDeck(card, 1, false)}
                                      className="w-6 h-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                      title="Adicionar ao baralho principal"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => addCardToDeck(card, 1, true)}
                                      className="w-6 h-6 p-0 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                      title="Adicionar ao sideboard"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Vista de Grelha (nova)
                            <div className="grid grid-cols-2 gap-2">
                              {visibleDeckCards.map((card) => (
                                <div
                                  key={card.id}
                                  className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                  onClick={() => setSelectedCard(card)}
                                >
                                  <div className="relative">
                                    <img
                                      src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                                      alt={card.name}
                                      className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                      loading="lazy"
                                    />
                                    {/* Sobreposição com informações da carta */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                                      <p className="text-white text-xs font-medium truncate">{card.name}</p>
                                      <div className="flex items-center justify-between">
                                        <span
                                          className="text-xs"
                                          dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                                        />
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            card.rarity === "mythic"
                                              ? "border-orange-500 text-orange-400"
                                              : card.rarity === "rare"
                                                ? "border-yellow-500 text-yellow-400"
                                                : card.rarity === "uncommon"
                                                  ? "border-gray-400 text-gray-300"
                                                  : "border-gray-600 text-gray-400"
                                          }`}
                                        >
                                          {card.rarity.charAt(0).toUpperCase()}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Botões de adicionar/remover, visíveis ao passar o rato */}
                                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        addCardToDeck(card, 1, false)
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 h-6 w-6"
                                      title="Adicionar ao baralho principal"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        addCardToDeck(card, 1, true)
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white p-1 h-6 w-6"
                                      title="Adicionar ao sideboard"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Botão Carregar Mais */}
                          {visibleCount < filteredDeckCards.length && (
                            <div className="text-center pt-4">
                              <Button
                                onClick={() => setVisibleCount((prev) => prev + 25)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Carregar Mais ({filteredDeckCards.length - visibleCount} restantes)
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400">Nenhuma carta encontrada.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Coluna do Meio - Baralho Principal */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">Baralho Principal ({deckStats.totalCards})</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                            {currentDeck.format === "commander" ? "99 cartas" : "60 cartas"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTextView(!textView)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            {textView ? <Grid3X3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                      {currentDeck.mainboard.length > 0 ? (
                        <div className="space-y-2">
                          {textView ? (
                            // Vista de Lista
                            <div className="space-y-2">
                              {currentDeck.mainboard
                                .sort((a, b) => a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                                  >
                                    <img
                                      src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                      alt={deckCard.card.name}
                                      className="w-10 h-14 rounded object-cover cursor-pointer"
                                      onClick={() => setSelectedCard(deckCard.card)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">{deckCard.card.name}</p>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="text-xs"
                                          dangerouslySetInnerHTML={{
                                            __html: formatManaSymbols(deckCard.card.mana_cost || ""),
                                          }}
                                        />
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            deckCard.card.rarity === "mythic"
                                              ? "border-orange-500 text-orange-400"
                                              : deckCard.card.rarity === "rare"
                                                ? "border-yellow-500 text-yellow-400"
                                                : deckCard.card.rarity === "uncommon"
                                                  ? "border-gray-400 text-gray-300"
                                                  : "border-gray-600 text-gray-400"
                                          }`}
                                        >
                                          {deckCard.card.rarity.charAt(0).toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-400 text-xs truncate">{deckCard.card.set_name}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => removeCardFromDeck(deckCard.card.id, 1, false)}
                                        className="w-6 h-6 p-0 bg-red-600 hover:bg-red-700 text-white text-xs"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-white text-sm font-medium w-6 text-center">
                                        {deckCard.quantity}
                                      </span>
                                      <Button
                                        size="sm"
                                        onClick={() => addCardToDeck(deckCard.card, 1, false)}
                                        className="w-6 h-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            // Vista de Grelha
                            <div className="grid grid-cols-3 gap-2">
                              {currentDeck.mainboard
                                .sort((a, b) => a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                    onClick={() => setSelectedCard(deckCard.card)}
                                  >
                                    <div className="relative">
                                      <img
                                        src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                        alt={deckCard.card.name}
                                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                        loading="lazy"
                                      />
                                      <div className="absolute top-1 left-1 bg-emerald-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                                        {deckCard.quantity}
                                      </div>
                                      {/* Sobreposição com nome da carta */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg">
                                        <p className="text-white text-xs font-medium truncate">{deckCard.card.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Botões de adicionar/remover, visíveis ao passar o rato */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          addCardToDeck(deckCard.card, 1, false)
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 h-6 w-6"
                                        title="Adicionar"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          removeCardFromDeck(deckCard.card.id, 1, false)
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white p-1 h-6 w-6"
                                        title="Remover"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg mb-2">O seu baralho principal está vazio</p>
                          <p className="text-gray-500 text-sm">
                            Use os botões <Plus className="w-4 h-4 inline mx-1" /> verdes para adicionar cartas
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Coluna Direita - Sideboard */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">Sideboard ({deckStats.sideboardCards})</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-500 text-blue-400">
                            15 cartas
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTextView(!textView)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            {textView ? <Grid3X3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                      {currentDeck.sideboard.length > 0 ? (
                        <div className="space-y-2">
                          {textView ? (
                            // Vista de Lista
                            <div className="space-y-2">
                              {currentDeck.sideboard
                                .sort((a, b) => a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                                  >
                                    <img
                                      src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                      alt={deckCard.card.name}
                                      className="w-10 h-14 rounded object-cover cursor-pointer"
                                      onClick={() => setSelectedCard(deckCard.card)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-medium truncate">{deckCard.card.name}</p>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className="text-xs"
                                          dangerouslySetInnerHTML={{
                                            __html: formatManaSymbols(deckCard.card.mana_cost || ""),
                                          }}
                                        />
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            deckCard.card.rarity === "mythic"
                                              ? "border-orange-500 text-orange-400"
                                              : deckCard.card.rarity === "rare"
                                                ? "border-yellow-500 text-yellow-400"
                                                : deckCard.card.rarity === "uncommon"
                                                  ? "border-gray-400 text-gray-300"
                                                  : "border-gray-600 text-gray-400"
                                          }`}
                                        >
                                          {deckCard.card.rarity.charAt(0).toUpperCase()}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-400 text-xs truncate">{deckCard.card.set_name}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => removeCardFromDeck(deckCard.card.id, 1, true)}
                                        className="w-6 h-6 p-0 bg-red-600 hover:bg-red-700 text-white text-xs"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="text-white text-sm font-medium w-6 text-center">
                                        {deckCard.quantity}
                                      </span>
                                      <Button
                                        size="sm"
                                        onClick={() => addCardToDeck(deckCard.card, 1, true)}
                                        className="w-6 h-6 p-0 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            // Vista de Grelha
                            <div className="grid grid-cols-3 gap-2">
                              {currentDeck.sideboard
                                .sort((a, b) => a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                    onClick={() => setSelectedCard(deckCard.card)}
                                  >
                                    <div className="relative">
                                      <img
                                        src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                        alt={deckCard.card.name}
                                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                        loading="lazy"
                                      />
                                      <div className="absolute top-1 left-1 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                                        {deckCard.quantity}
                                      </div>
                                      {/* Sobreposição com nome da carta */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg">
                                        <p className="text-white text-xs font-medium truncate">{deckCard.card.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Botões de adicionar/remover, visíveis ao passar o rato */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeCardFromDeck(deckCard.card.id, 1, true);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white p-1 h-6 w-6"
                                        title="Remover"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addCardToDeck(deckCard.card, 1, true);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-1 h-6 w-6"
                                        title="Adicionar"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg mb-2">O seu sideboard está vazio</p>
                          <p className="text-gray-500 text-sm">
                            Use os botões <Plus className="w-4 h-4 inline mx-1" /> azuis para adicionar cartas
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Nenhuma carta carregada para o construtor de baralhos */}
              {isSearchingCards && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-white text-lg">{loadingMessage}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            
<TabsContent value="rules" className="space-y-6">
  {/* Cabeçalho das Regras */}
  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-white text-xl">Consulta de Regras</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Seleção de Fonte */}
      <div>
        <label className="text-sm font-medium text-white mb-2 block">Fonte das Cartas</label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={rulesSource === "search" ? "default" : "outline"}
            size="sm"
            onClick={() => setRulesSource("search")}
            className={rulesSource === "search" 
              ? "bg-emerald-600 text-white" 
              : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            }
          >
            Procurar Cartas
          </Button>
          <Button
            variant={rulesSource === "collection" ? "default" : "outline"}
            size="sm"
            onClick={() => setRulesSource("collection")}
            className={rulesSource === "collection" 
              ? "bg-emerald-600 text-white" 
              : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            }
            disabled={savedCollections.length === 0}
          >
            Da Coleção ({savedCollections.length})
          </Button>
          <Button
            variant={rulesSource === "deck" ? "default" : "outline"}
            size="sm"
            onClick={() => setRulesSource("deck")}
            className={rulesSource === "deck" 
              ? "bg-emerald-600 text-white" 
              : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            }
            disabled={savedDecks.length === 0}
          >
            Do Baralho ({savedDecks.length})
          </Button>
        </div>
      </div>

      {/* Seleção de Coleção/Baralho */}
      {rulesSource === "collection" && (
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Selecionar Coleção</label>
          <Select value={selectedCollectionForRules} onValueChange={setSelectedCollectionForRules}>
            <SelectTrigger className={selectClasses}>
              <SelectValue placeholder="Escolha uma coleção" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {savedCollections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id} className="text-white">
                  {collection.name} ({collection.cards.length} cartas)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {rulesSource === "deck" && (
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Selecionar Baralho</label>
          <Select value={selectedDeckForRules} onValueChange={setSelectedDeckForRules}>
            <SelectTrigger className={selectClasses}>
              <SelectValue placeholder="Escolha um baralho" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {savedDecks.map((deck) => (
                <SelectItem key={deck.id} value={deck.id} className="text-white">
                  {deck.name} ({deck.mainboard.length + deck.sideboard.length} cartas)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Campo de pesquisa */}
      {rulesSource === "search" && (
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Procurar Carta</label>
          <Input
            placeholder="Digite o nome da carta..."
            value={rulesSearchQuery}
            onChange={(e) => setRulesSearchQuery(e.target.value)}
            className={inputClasses}
          />
        </div>
      )}
    </CardContent>
  </Card>

  {/* Layout de Duas Colunas */}
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
    {/* Coluna Esquerda - Cartas Disponíveis */}
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">
          {rulesSource === "search" ? "Resultados da Procura" : 
           rulesSource === "collection" ? "Cartas da Coleção" : "Cartas do Baralho"}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {rulesSource === "search" ? (
          // Resultados da procura
          <div className="space-y-2">
            {rulesSearchQuery.length >= 2 ? (
              allCards
                .filter(card => normalize(card.name).includes(normalize(rulesSearchQuery)))
                .slice(0, 20)
                .map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRulesCard(card)
                      fetchCardRulings(card)
                    }}
                  >
                    <img
                      src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                      alt={card.name}
                      className="w-12 h-16 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{card.name}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs"
                          dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                        />
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            card.rarity === "mythic"
                              ? "border-orange-500 text-orange-400"
                              : card.rarity === "rare"
                                ? "border-yellow-500 text-yellow-400"
                                : card.rarity === "uncommon"
                                  ? "border-gray-400 text-gray-300"
                                  : "border-gray-600 text-gray-400"
                          }`}
                        >
                          {card.rarity.charAt(0).toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{card.set_name}</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                Digite pelo menos 2 caracteres para procurar cartas
              </p>
            )}
          </div>
        ) : (
          // Cartas da coleção/baralho
          <div className="space-y-2">
            {availableRulesCards.length > 0 ? (
              availableRulesCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRulesCard(card)
                    fetchCardRulings(card)
                  }}
                >
                  <img
                    src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                    alt={card.name}
                    className="w-12 h-16 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{card.name}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs"
                        dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                      />
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          card.rarity === "mythic"
                            ? "border-orange-500 text-orange-400"
                            : card.rarity === "rare"
                              ? "border-yellow-500 text-yellow-400"
                              : card.rarity === "uncommon"
                                ? "border-gray-400 text-gray-300"
                                : "border-gray-600 text-gray-400"
                        }`}
                      >
                        {card.rarity.charAt(0).toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs truncate">{card.set_name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                {rulesSource === "collection" && !selectedCollectionForRules
                  ? "Selecione uma coleção para ver as cartas disponíveis."
                  : rulesSource === "deck" && !selectedDeckForRules
                  ? "Selecione um baralho para ver as cartas disponíveis."
                  : "Nenhuma carta disponível para esta fonte."}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Coluna Direita - Regras da Carta */}
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">Regras da Carta</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {isLoadingRulings ? (
          <div className="text-center py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-white">A carregar regras...</p>
          </div>
        ) : selectedRulesCard ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
              <img
                src={getOptimizedImageUrl(selectedRulesCard, false) || "/placeholder.svg"}
                alt={selectedRulesCard.name}
                className="w-24 h-auto rounded-lg shadow-md"
              />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedRulesCard.name}</h3>
                <p className="text-gray-400 text-sm">{selectedRulesCard.type_line}</p>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm text-gray-300"
                    dangerouslySetInnerHTML={{ __html: formatManaSymbols(selectedRulesCard.mana_cost || "") }}
                  />
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      selectedRulesCard.rarity === "mythic"
                        ? "border-orange-500 text-orange-400"
                        : selectedRulesCard.rarity === "rare"
                          ? "border-yellow-500 text-yellow-400"
                          : selectedRulesCard.rarity === "uncommon"
                            ? "border-gray-400 text-gray-300"
                            : "border-gray-600 text-gray-400"
                    }`}
                  >
                    {selectedRulesCard.rarity.charAt(0).toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            
            {cardRulings.length > 0 ? (
              <div className="space-y-3">
                {cardRulings.map((ruling, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <p className="text-gray-300 text-sm">{ruling.comment}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Fonte: {ruling.source} • Publicado em: {new Date(ruling.published_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nenhuma regra específica encontrada para esta carta.
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            Selecione uma carta na coluna da esquerda para ver as suas regras.
          </p>
        )}
      </CardContent>
    </Card>
  </div>
</TabsContent>


          {/* Diálogo de Detalhes da Carta */}
          {selectedCard && (
            <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
              <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 flex justify-center items-center">
                    {/* Imagem da carta de Magic: The Gathering (arte completa) */}
                    <img
                      src={getOptimizedImageUrl(selectedCard, false) || "/placeholder.svg"}
                      alt={selectedCard.name}
                      className="w-full h-auto rounded-lg shadow-lg max-w-sm"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <DialogHeader>
                      <DialogTitle className="text-white text-2xl">
                        {selectedCard.name}{" "}
                        <span
                          className="text-gray-400 text-sm"
                          dangerouslySetInnerHTML={{ __html: formatManaSymbols(selectedCard.mana_cost || "") }}
                        />
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-400 text-sm">{selectedCard.type_line}</p>
                    <p className="text-white text-sm">{selectedCard.oracle_text}</p>
                    {selectedCard.power && selectedCard.toughness && (
                      <p className="text-gray-300">
                        P/T: {selectedCard.power}/{selectedCard.toughness}
                      </p>
                    )}
                    <p className="text-gray-300">Artista: {selectedCard.artist}</p>
                    <p className="text-gray-300">Edição: {selectedCard.set_name}</p>
                    <p className="text-gray-300">Raridade: {selectedCard.rarity}</p>
                    <p className="text-gray-300">Lançamento: {selectedCard.released_at}</p>
                    <p className="text-gray-300 font-bold">
                      Valor Estimado: R$ {getEstimatedPrice(selectedCard).toFixed(2)}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button
                        size="sm"
                        onClick={() => addCardToCollection(selectedCard, 1, "Near Mint", false)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar à Coleção (Normal)
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addCardToCollection(selectedCard, 1, "Near Mint", true)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar à Coleção (Foil)
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addCardToDeck(selectedCard, 1, false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar ao Baralho (Principal)
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addCardToDeck(selectedCard, 1, true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar ao Baralho (Sideboard)
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Diálogo de Login/Registo */}
          <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">{isRegistering ? "Registar" : "Login"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Nome Completo</label>
                    <Input
                      type="text"
                      placeholder="O seu nome completo"
                      value={loginForm.name}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputClasses}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">E-mail</label>
                  <Input
                    type="email"
                    placeholder="o_seu@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Palavra-passe</label>
                  <Input
                    type="password"
                    placeholder="A sua palavra-passe"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={inputClasses}
                    required
                  />
                </div>
                {isRegistering && (
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Confirmar Palavra-passe</label>
                    <Input
                      type="password"
                      placeholder="Confirme a sua palavra-passe"
                      value={loginForm.confirmPassword}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className={inputClasses}
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loginLoading}>
                  {loginLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : isRegistering ? (
                    "Registar"
                  ) : (
                    "Entrar"
                  )}
                </Button>
                <Button type="button" variant="link" onClick={toggleAuthMode} className="w-full text-gray-400">
                  {isRegistering ? "Já tem uma conta? Faça login" : "Não tem uma conta? Registe-se"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Diálogo do Perfil */}
          <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Editar Perfil</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Nome</label>
                  <Input
                    type="text"
                    placeholder="O seu nome"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Sobrenome</label>
                  <Input
                    type="text"
                    placeholder="O seu sobrenome"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">E-mail</label>
                  <Input
                    type="email"
                    placeholder="o_seu@email.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Biografia</label>
                  <Textarea
                    placeholder="Conte um pouco sobre si..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                    className={inputClasses}
                    rows={3}
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <h4 className="text-white text-md font-semibold">Alterar Palavra-passe</h4>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Palavra-passe Atual</label>
                    <Input
                      type="password"
                      placeholder="A sua palavra-passe atual (se for alterar)"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Nova Palavra-passe</label>
                    <Input
                      type="password"
                      placeholder="Nova palavra-passe"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Confirmar Nova Palavra-passe</label>
                    <Input
                      type="password"
                      placeholder="Confirme a nova palavra-passe"
                      value={profileForm.confirmNewPassword}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loginLoading}>
                  {loginLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Alterações
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
