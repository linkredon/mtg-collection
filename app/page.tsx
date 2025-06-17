"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
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

  // Corrigir a função saveCollection
  const saveCollection = () => {
    // Remover validação que impedia salvar
    const collectionToSave: UserCollection = {
      ...currentCollection,
      id: currentCollection.id || Date.now().toString(),
      name: currentCollection.name || "Minha Coleção", // Garantir que sempre tenha um nome
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
    console.log("Coleção salva com sucesso!")
  }

  const loadCollection = (collection: UserCollection) => {
    setCurrentCollection(collection)
    setShowLoadCollectionDialog(false)
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
        const cleanType = type.replace(/[^a-zA-Z]/g, "")
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
        const cleanType = type.replace(/[^a-zA-Z]/g, "")
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
    const maxValue = Math.max(...Object.values(data))
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a)

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
      if (trimmedLine.toLowerCase().includes("sideboard") || trimmedLine.toLowerCase().includes("side:")) {
        isInSideboard = true
        continue
      }

      // Pular linhas vazias ou comentários
      if (!trimmedLine || trimmedLine.startsWith("//") || trimmedLine.startsWith("#")) {
        continue
      }

      // Tentar extrair quantidade e nome da carta
      const match = trimmedLine.match(/^(\d+)\s+(.+)$/)
      if (match) {
        const quantity = Number.parseInt(match[1], 10)
        const cardName = match[2].trim()

        // Procurar a carta na base de dados do deck builder
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
      description: "",
      createdAt: "",
      updatedAt: "",
    })
  }

  const deleteDeck = (deckId: string) => {
    setSavedDecks((prev) => prev.filter((deck) => deck.id !== deckId))
  }

  // Função para buscar imagem de background aleatória
  const fetchRandomBackground = async () => {
    setIsLoadingBackground(true)
    try {
      console.log("Buscando background aleatório...")
      const response = await fetch("https://api.scryfall.com/cards/random?q=has:image")

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
        setBackgroundImage(imageUrl)
        localStorage.setItem("mtg-background-image", imageUrl)
        console.log("Background definido com sucesso!")
      } else {
        console.warn("Nenhuma imagem encontrada na carta")
      }
    } catch (error) {
      console.error("Erro ao buscar background:", error)
      // Tentar novamente após 2 segundos
      setTimeout(() => {
        fetchRandomBackground()
      }, 2000)
    } finally {
      setIsLoadingBackground(false)
    }
  }

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
          alert("Senhas não coincidem!")
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
        console.log("Usuário registrado com sucesso!")
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
        console.log("Login realizado com sucesso!")
      }

      setIsAuthenticated(true)
      setShowLoginDialog(false)
      setLoginForm({ email: "", password: "", name: "", confirmPassword: "" })
    } catch (error) {
      console.error("Erro na autenticação:", error)
      alert("Erro na autenticação. Tente novamente.")
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
    console.log("Logout realizado com sucesso!")
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

      // Validar senha atual (simulado)
      if (profileForm.newPassword && !profileForm.currentPassword) {
        alert("Digite sua senha atual para alterar a senha.")
        return
      }

      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmNewPassword) {
        alert("As novas senhas não coincidem!")
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

      // Limpar campos de senha
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }))

      console.log("Perfil atualizado com sucesso!")
      alert("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      alert("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setLoginLoading(false)
    }
  }

  // Corrigir handleFileUpload para popular a coleção
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setLoadingMessage("Processando coleção...")

    try {
      const text = await file.text()
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)

      if (lines.length <= 1) {
        console.log("O arquivo CSV está vazio ou contém apenas cabeçalhos.")
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const nameIndex = headers.findIndex((h) => {
        if (!h || typeof h !== "string") return false
        const normalized = normalize(h)
        return normalized.includes("name") || normalized.includes("nome")
      })

      const quantityIndex = headers.findIndex((h) => {
        if (!h || typeof h !== "string") return false
        const normalized = normalize(h)
        return normalized.includes("quantity") || normalized.includes("quantidade") || normalized.includes("qty")
      })

      const setIndex = headers.findIndex((h) => {
        if (!h || typeof h !== "string") return false
        const normalized = normalize(h)
        return (
          normalized.includes("set") ||
          normalized.includes("edition") ||
          normalized.includes("edicao") ||
          normalized.includes("expansao")
        )
      })

      if (nameIndex === -1) {
        console.log("Coluna de nome não encontrada no CSV.")
        return
      }

      const newOwnedCards = new Map<string, OwnedCard>()
      const newCollectionCards: CollectionCard[] = []
      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        const cardName = values[nameIndex]
        const cardSet = setIndex >= 0 ? values[setIndex] : ""
        const quantity = quantityIndex >= 0 ? Number.parseInt(values[quantityIndex]) || 1 : 1

        if (!cardName || typeof cardName !== "string" || !cardName.trim()) continue

        // Primeiro tentar match por nome e set
        let matchingCard = null
        if (cardSet && typeof cardSet === "string" && cardSet.trim()) {
          matchingCard = allCards.find(
            (card) =>
              normalize(card.name) === normalize(cardName) &&
              (normalize(card.set_name) === normalize(cardSet) || normalize(card.set_code) === normalize(cardSet)),
          )
        }

        // Se não encontrou, tentar apenas por nome
        if (!matchingCard) {
          matchingCard = allCards.find((card) => normalize(card.name) === normalize(cardName))
        }

        if (matchingCard) {
          const entry: Record<string, string> = {}
          headers.forEach((header, idx) => {
            entry[header || `Column_${idx}`] = values[idx] || ""
          })

          newOwnedCards.set(matchingCard.id, {
            originalEntry: entry,
            scryfallData: matchingCard,
          })

          // Adicionar à coleção atual
          const collectionCard: CollectionCard = {
            card: matchingCard,
            quantity: quantity,
            condition: "Near Mint",
            foil: false,
            addedAt: new Date().toISOString(),
          }
          newCollectionCards.push(collectionCard)

          successCount++
        } else {
          errorCount++
          console.log(`Carta não encontrada: ${cardName}`)
        }
      }

      setOwnedCardsMap(newOwnedCards)

      // Atualizar a coleção atual com as cartas importadas
      setCurrentCollection((prev) => ({
        ...prev,
        cards: [...prev.cards, ...newCollectionCards],
        updatedAt: new Date().toISOString(),
      }))

      console.log(`Processado. ${successCount} cartas carregadas. ${errorCount} falharam.`)
    } catch (error) {
      console.error("Error processing CSV:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load saved background from localStorage and fetch new one if needed
  useEffect(() => {
    const savedBackground = localStorage.getItem("mtg-background-image")
    if (savedBackground) {
      setBackgroundImage(savedBackground)
    } else {
      fetchRandomBackground()
    }
  }, [])

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
        console.error("Erro ao carregar usuário salvo:", error)
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
      alert("Por favor, digite um nome para o filtro.")
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
    console.log("Cancelando carregamento...")
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
  const fetchGeneralCards = async () => {
    if (isLoadingCards) {
      console.log("Já está carregando cartas, ignorando nova chamada")
      return
    }

    console.log("Iniciando carregamento de cartas gerais...")

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoadingCards(true)
    setLoading(true)
    setLoadingMessage("Carregando cartas...")

    try {
      // Usar uma query mais simples e confiável
      let url = "https://api.scryfall.com/cards/search?q=game:paper&unique=prints&order=released"
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 30 // Reduzir para evitar rate limits
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3

      while (url && pageCount < maxPages && consecutiveErrors < maxConsecutiveErrors) {
        // Verificar se foi cancelado
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Carregamento foi cancelado")
          return
        }

        pageCount++
        setLoadingMessage(`Carregando cartas (página ${pageCount}/${maxPages})...`)
        console.log(`Carregando página ${pageCount}`)

        try {
          // Delay progressivo para evitar rate limits
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
              // Rate limit - aguardar mais tempo
              console.log("Rate limit atingido, aguardando 2 segundos...")
              await new Promise((r) => setTimeout(r, 2000))
              consecutiveErrors++
              continue
            } else if (response.status >= 500) {
              // Erro do servidor - tentar novamente
              console.log(`Erro do servidor (${response.status}), tentando novamente...`)
              consecutiveErrors++
              await new Promise((r) => setTimeout(r, 1000))
              continue
            } else {
              throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
            }
          }

          const data = await response.json()

          if (!data.data || data.data.length === 0) {
            console.log("Nenhum dado retornado, parando")
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
          consecutiveErrors = 0 // Reset contador de erros
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
            console.log("Muitos erros consecutivos, parando o carregamento")
            break
          }

          // Aguardar antes de tentar novamente
          const retryDelay = Math.min(1000 * consecutiveErrors, 5000)
          console.log(`Aguardando ${retryDelay}ms antes de tentar novamente...`)
          await new Promise((r) => setTimeout(r, retryDelay))
        }
      }

      // Verificar se foi cancelado antes de processar
      if (abortControllerRef.current?.signal.aborted) {
        console.log("Carregamento foi cancelado antes de processar")
        return
      }

      if (cards.length === 0) {
        console.log("Nenhuma carta foi carregada, tentando fallback...")
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
      setLoadingMessage("Erro ao carregar cartas. Verifique sua conexão.")
    } finally {
      setIsLoadingCards(false)
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  // Função para carregar cartas para o deck builder (todas as cartas)
  const fetchDeckBuilderCards = async () => {
    if (deckBuilderCards.length > 0) {
      console.log("Cartas do deck builder já carregadas")
      return
    }

    setIsSearchingCards(true)
    setLoadingMessage("Carregando cartas para o deck builder...")

    try {
      // Usar query mais específica para deck building (cartas únicas)
      let url = "https://api.scryfall.com/cards/search?q=game:paper&unique=cards&order=name"
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 25 // Limite menor para deck builder
      let consecutiveErrors = 0
      const maxConsecutiveErrors = 3

      while (url && pageCount < maxPages && consecutiveErrors < maxConsecutiveErrors) {
        pageCount++
        setLoadingMessage(`Carregando cartas para deck builder (${pageCount}/${maxPages})...`)
        console.log(`Carregando página ${pageCount} para deck builder`)

        try {
          // Delay para evitar rate limits
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
          console.log(`Deck builder página ${pageCount}: ${newCards.length} cartas, total: ${cards.length}`)

          if (!data.has_more || !data.next_page) {
            break
          }

          url = data.next_page
        } catch (error: any) {
          consecutiveErrors++
          console.error(`Erro na página ${pageCount} do deck builder:`, error.message)

          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("Muitos erros consecutivos no deck builder, parando")
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
      console.log(`${uniqueCards.length} cartas únicas carregadas para o deck builder`)
    } catch (error) {
      console.error("Erro ao carregar cartas do deck builder:", error)
    } finally {
      setIsSearchingCards(false)
    }
  }
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
  const applyFilters = () => {
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
      let valA: any, valB: any

      if (sortBy === "name") {
        valA = a.name
        valB = b.name
      } else {
        // Ordenar por data de lançamento (mais recente primeiro por padrão)
        valA = new Date(a.released_at || 0)
        valB = new Date(b.released_at || 0)
      }

      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0

      // Para edição, inverter a ordem padrão para mostrar mais recentes primeiro
      if (sortBy === "edition") {
        return sortAscending ? -comparison : comparison
      } else {
        return sortAscending ? comparison : -comparison
      }
    })

    setFilteredCards(filtered)
  }

  // Aplicar filtros para o construtor de deck
  const applyDeckFilters = () => {
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
  }

  // Carregar cartas automaticamente quando o componente monta
  useEffect(() => {
    fetchGeneralCards()
  }, [])

  // Carregar cartas do deck builder quando a aba é acessada
  useEffect(() => {
    if (activeTab === "deckbuilder" && deckBuilderCards.length === 0) {
      fetchDeckBuilderCards()
    }
  }, [activeTab])

  // Effect para aplicar filtros quando dados mudam
  useEffect(() => {
    if (allCards.length > 0) {
      applyFilters()
    }
  }, [
    allCards,
    ownedCardsMap,
    ownershipFilter,
    hiddenSets,
    searchQuery,
    collectionType,
    rarityFilter,
    cmcFilter,
    powerFilter,
    toughnessFilter,
    artistFilter,
    languageFilter,
    oracleTextFilter,
    foilFilter,
    activeColors,
    sortBy,
    sortAscending,
  ])

  // Effect para aplicar filtros ao construtor de deck
  useEffect(() => {
    if (deckBuilderCards.length > 0) {
      applyDeckFilters()
    }
  }, [deckBuilderCards, deckSearchQuery, rarityFilter, cmcFilter, powerFilter, toughnessFilter, activeColors])

  // Cleanup ao desmontar componente
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

  const groupedCards = visibleCards.reduce(
    (acc, card) => {
      const set = card.set_name || "Sem Edição"
      if (!acc[set]) acc[set] = []
      acc[set].push(card)
      return acc
    },
    {} as Record<string, MTGCard[]>,
  )

  // Classes padrão para inputs e selects
  const inputClasses =
    "bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
  const selectClasses = "bg-gray-900 border-gray-600 text-white focus:ring-emerald-500 focus:border-emerald-500"

  // Color maps para gráficos
  const colorMap = {
    W: "#fffbd5",
    U: "#0e68ab",
    B: "#150b00",
    R: "#d3202a",
    G: "#00733e",
    C: "#ccc2c0",
  }

  const rarityColorMap = {
    common: "#1f2937",
    uncommon: "#374151",
    rare: "#fbbf24",
    mythic: "#f59e0b",
  }

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

              {/* User section */}
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

            {isLoadingBackground && <p className="text-xs text-gray-400 mt-1">Carregando nova imagem...</p>}
            {backgroundImage && !isLoadingBackground && <p className="text-xs text-gray-500 mt-1">Background ativo</p>}
            <p className="text-gray-300">Gerencie sua coleção de Magic: The Gathering</p>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/70 border-gray-700 backdrop-blur-sm mb-4 sm:mb-6">
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
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="deckbuilder"
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-300"
              >
                <Hammer className="w-4 h-4 mr-2" />
                Construtor de Deck
              </TabsTrigger>
            </TabsList>

            {/* Collection Tab */}
            <TabsContent value="collection" className="space-y-6">
              {/* Collection Header */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side - Collection Info */}
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
                        <span>Cartas: {currentCollection.cards.length}</span>
                        <span>•</span>
                        <span>Valor: R$ {dashboardStats.totalValue.toFixed(2)}</span>
                        <span>•</span>
                        <span>Cópias: {dashboardStats.totalCopies}</span>
                      </div>
                    </div>

                    {/* Right side - Actions */}
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
                            Salvar Coleção
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Salvar Coleção</DialogTitle>
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
                                Salvar
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
                            <DialogTitle className="text-white">Coleções Salvas</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {savedCollections.length === 0 ? (
                              <p className="text-gray-400 text-center py-4">Nenhuma coleção salva ainda.</p>
                            ) : (
                              savedCollections.map((collection) => (
                                <div key={collection.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="text-white font-medium mb-1">{collection.name}</h3>
                                      <p className="text-sm text-gray-400 mb-2">
                                        <strong>Cartas:</strong> {collection.cards.length} • <strong>Criado:</strong>{" "}
                                        {new Date(collection.createdAt).toLocaleDateString("pt-BR")}
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

              {/* Search and Basic Filters */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center justify-center">
                    <div className="flex-1 min-w-48">
                      <Input
                        placeholder="Buscar cartas..."
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
                      {sortAscending ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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

                    {/* Botões para gerenciar filtros salvos */}
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Filtros
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Salvar Filtros Atuais</DialogTitle>
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
                              <strong>Busca:</strong> {searchQuery || "Nenhuma"}
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
                              Salvar
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
                          <DialogTitle className="text-white">Filtros Salvos</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {savedFilters.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Nenhum filtro salvo ainda.</p>
                          ) : (
                            savedFilters.map((filter) => (
                              <div key={filter.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-white font-medium mb-1">{filter.name}</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                      <strong>Tipo:</strong> {filter.collectionType} •<strong> Criado:</strong>{" "}
                                      {new Date(filter.createdAt).toLocaleDateString("pt-BR")}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                      {filter.filters.searchQuery && (
                                        <span>Busca: "{filter.filters.searchQuery}" • </span>
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
                      {/* Color Filters */}
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

                      {/* Collection Type Filter */}
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

                        {availableArtists.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Artista</label>
                            <Select value={artistFilter} onValueChange={setArtistFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="all" className="text-white">
                                  Todos
                                </SelectItem>
                                {availableArtists.slice(0, 50).map((artist) => (
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

              {/* Loading State */}
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

              {/* Two Column Layout */}
              {!loading && !isLoadingCards && allCards.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left Column - All Cards */}
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
                            // Text View
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
                            // Grid View
                            <div className="grid grid-cols-3 gap-2">
  {visibleCards.map((card) => {
    const quantityInCollection = getCardQuantityInCollection(card.id, false)
    const quantityInCollectionFoil = getCardQuantityInCollection(card.id, true)

    return (
      <div
        key={card.id}
        className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
      >
        <div className="relative">
          <img
            src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
            alt={card.name}
            className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
            loading="lazy"
            onClick={() => setSelectedCard(card)}
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
        
        {/* Área dos botões - apenas no canto inferior direito */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col gap-1">
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
      </div>
    )
  })}
</div>
                          )}

                          {/* Load More Button */}
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

                  {/* Right Column - My Collection */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-xl">
                          Minha Coleção ({currentCollection.cards.length})
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
                            // Text View
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
                            // Grid View
                            <div className={`grid grid-cols-${currentColumns} gap-2`}>
  {currentCollection.cards
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .map((collectionCard) => (
      <div
        key={`${collectionCard.card.id}-${collectionCard.foil}`}
        className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
      >
        <div className="relative">
          <img
            src={getOptimizedImageUrl(collectionCard.card, true) || "/placeholder.svg"}
            alt={collectionCard.card.name}
            className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
            loading="lazy"
            onClick={() => setSelectedCard(collectionCard.card)}
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
        
        {/* Área dos botões - apenas no canto inferior direito */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col gap-1">
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
      </div>
    ))}
</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg mb-2">Sua coleção está vazia</p>
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

              {/* No Cards Loaded */}
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

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {currentCollection.cards.length === 0 ? (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400 text-lg mb-4">Monte sua coleção para ver estatísticas detalhadas.</p>
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
                  {/* Overview Stats */}
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
                          {dashboardStats.uniqueCards > 0
                            ? (dashboardStats.totalValue / dashboardStats.uniqueCards).toFixed(2)
                            : "0.00"}
                        </p>
                        <p className="text-sm text-gray-400">Valor Médio/Carta</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
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
                      data={Object.fromEntries(
                        Object.entries(dashboardStats.cmcDistribution)
                          .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
                          .slice(0, 10),
                      )}
                      title="Curva de Mana (CMC)"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* Deck Builder Tab */}
            <TabsContent value="deckbuilder" className="space-y-6">
              {/* Deck Header */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side - Deck Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Nome do deck"
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

                    {/* Right side - Actions */}
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
                            Standard
                          </SelectItem>
                          <SelectItem value="modern" className="text-white">
                            Modern
                          </SelectItem>
                          <SelectItem value="legacy" className="text-white">
                            Legacy
                          </SelectItem>
                          <SelectItem value="vintage" className="text-white">
                            Vintage
                          </SelectItem>
                          <SelectItem value="commander" className="text-white">
                            Commander
                          </SelectItem>
                          <SelectItem value="pioneer" className="text-white">
                            Pioneer
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
                            Salvar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Salvar Deck</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">Nome do Deck</label>
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
                                Salvar
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
                            <DialogTitle className="text-white">Decks Salvos</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {savedDecks.length === 0 ? (
                              <p className="text-gray-400 text-center py-4">Nenhum deck salvo ainda.</p>
                            ) : (
                              savedDecks.map((deck) => (
                                <div key={deck.id} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="text-white font-medium mb-1">{deck.name}</h3>
                                      <p className="text-sm text-gray-400 mb-2">
                                        <strong>Formato:</strong> {deck.format.toUpperCase()} • <strong>Cartas:</strong>{" "}
                                        {deck.mainboard.reduce((sum, card) => sum + card.quantity, 0)} •{" "}
                                        <strong>Criado:</strong> {new Date(deck.createdAt).toLocaleDateString("pt-BR")}
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
                            <DialogTitle className="text-white">Importar Lista de Deck</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-white mb-2 block">
                                Cole sua lista de deck aqui:
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
                                <strong>Formato aceito:</strong> Quantidade Nome da Carta (ex: "4 Lightning Bolt")
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
                          alert("Lista do deck copiada para a área de transferência!")
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

              {/* Deck Search */}
              <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-48">
                      <Input
                        placeholder="Buscar cartas para adicionar ao deck..."
                        value={deckSearchQuery}
                        onChange={(e) => setDeckSearchQuery(e.target.value)}
                        className={inputClasses}
                      />
                    </div>

                    {/* Filtros básicos para deck builder */}
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

                  {/* Color Filters for Deck Builder */}
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

              {/* Loading State for Deck Builder */}
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

              {/* Three Column Layout for Deck Builder */}
              {!isSearchingCards && deckBuilderCards.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column - Available Cards */}
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
                            // Lista View (atual)
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
                                      title="Adicionar ao deck principal"
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
                            // Grid View (novo)
                            <div className="grid grid-cols-2 gap-2">
                              {visibleDeckCards.map((card) => (
                                <div
                                  key={card.id}
                                  className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                >
                                  <div className="relative">
                                    <img
                                      src={getOptimizedImageUrl(card, true) || "/placeholder.svg"}
                                      alt={card.name}
                                      className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                      loading="lazy"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedCard(card)
                                      }}
                                    />
                                    {/* Overlay com informações da carta */}
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
                                  
                                  {/* Área dos botões - apenas no canto inferior direito */}
                                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="flex flex-col gap-1">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          addCardToDeck(card, 1, false)
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 h-6 w-6"
                                        title="Adicionar ao deck principal"
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
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Load More Button */}
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

                  {/* Middle Column - Mainboard */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">Deck Principal ({deckStats.totalCards})</CardTitle>
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
                            // Lista View
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
                            // Grid View
                            <div className="grid grid-cols-3 gap-2">
                              {currentDeck.mainboard
                                .sort((a, b) => a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                  >
                                    <div className="relative">
                                      <img
                                        src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                        alt={deckCard.card.name}
                                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                        loading="lazy"
                                        onClick={(e) => setSelectedCard(deckCard.card)}
                                      />
                                      <div className="absolute top-1 left-1 bg-emerald-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                                        {deckCard.quantity}
                                      </div>
                                      {/* Overlay com nome da carta */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg">
                                        <p className="text-white text-xs font-medium truncate">{deckCard.card.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Área dos botões - apenas no canto inferior direito */}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <div className="flex flex-col gap-1">
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
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg mb-2">Deck principal vazio</p>
                          <p className="text-gray-500 text-sm">
                            Use os botões <Plus className="w-4 h-4 inline mx-1" /> verdes para adicionar cartas
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Right Column - Sideboard */}
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
                            // Lista View
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
                            // Grid View
                            <div className="grid grid-cols-3 gap-2">
                              {currentDeck.sideboard
                                .sort((a, b) => a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                                  >
                                    <div className="relative">
                                      <img
                                        src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                        alt={deckCard.card.name}
                                        className="w-full h-auto rounded-lg shadow-lg cursor-pointer"
                                        loading="lazy"
                                        onClick={(e) => setSelectedCard(deckCard.card)}
                                      />
                                      <div className="absolute top-1 left-1 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                                        {deckCard.quantity}
                                      </div>
                                      {/* Overlay com nome da carta */}
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 rounded-b-lg">
                                        <p className="text-white text-xs font-medium truncate">{deckCard.card.name}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Área dos botões - apenas no canto inferior direito */}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <div className="flex flex-col gap-1">
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            removeCardFromDeck(deckCard.card.id, 1, true)
                                          }}
                                          className="bg-red-600 hover:bg-red-700 text-white p-1"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            addCardToDeck(deckCard.card, 1, true)
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white p-1"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-400 text-lg mb-2">Sideboard vazio</p>
                          <p className="text-gray-500 text-sm">
                            Use os botões <Plus className="w-4 h-4 inline mx-1" /> azuis para adicionar cartas
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* No Cards Loaded for Deck Builder */}
              {!isSearchingCards && deckBuilderCards.length === 0 && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400 text-lg mb-4">Carregando cartas para o construtor de deck...</p>
                    <Button onClick={fetchDeckBuilderCards} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Carregar Cartas
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Card Detail Modal */}
          <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedCard && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-white text-2xl">{selectedCard.name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side - Card Image */}
                    <div className="space-y-4">
                      <img
                        src={getOptimizedImageUrl(selectedCard) || "/placeholder.svg"}
                        alt={selectedCard.name}
                        className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                      />

                      {/* Action buttons */}
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => addCardToCollection(selectedCard, 1, "Near Mint", false)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Normal
                        </Button>
                        <Button
                          onClick={() => addCardToCollection(selectedCard, 1, "Near Mint", true)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Foil
                        </Button>
                      </div>

                      {activeTab === "deckbuilder" && (
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => addCardToDeck(selectedCard, 1, false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Deck Principal
                          </Button>
                          <Button
                            onClick={() => addCardToDeck(selectedCard, 1, true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Sideboard
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Right side - Card Details */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Custo de Mana:</span>
                          <div
                            className="text-white"
                            dangerouslySetInnerHTML={{ __html: formatManaSymbols(selectedCard.mana_cost || "N/A") }}
                          />
                        </div>
                        <div>
                          <span className="text-gray-400">CMC:</span>
                          <p className="text-white">{selectedCard.cmc}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Tipo:</span>
                          <p className="text-white">{selectedCard.type_line}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Raridade:</span>
                          <Badge
                            variant="outline"
                            className={`${
                              selectedCard.rarity === "mythic"
                                ? "border-orange-500 text-orange-400"
                                : selectedCard.rarity === "rare"
                                  ? "border-yellow-500 text-yellow-400"
                                  : selectedCard.rarity === "uncommon"
                                    ? "border-gray-400 text-gray-300"
                                    : "border-gray-600 text-gray-400"
                            }`}
                          >
                            {selectedCard.rarity.charAt(0).toUpperCase() + selectedCard.rarity.slice(1)}
                          </Badge>
                        </div>
                        {selectedCard.power && (
                          <div>
                            <span className="text-gray-400">Poder/Resistência:</span>
                            <p className="text-white">
                              {selectedCard.power}/{selectedCard.toughness}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Edição:</span>
                          <p className="text-white">{selectedCard.set_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Artista:</span>
                          <p className="text-white">{selectedCard.artist}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Preço Estimado:</span>
                          <p className="text-green-400 font-medium">R$ {getEstimatedPrice(selectedCard).toFixed(2)}</p>
                        </div>
                      </div>

                      {selectedCard.oracle_text && (
                        <div>
                          <span className="text-gray-400 block mb-2">Texto do Oráculo:</span>
                          <div
                            className="text-white bg-gray-800 p-3 rounded-lg text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatManaSymbols(selectedCard.oracle_text) }}
                          />
                        </div>
                      )}

                      {/* Collection Status */}
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Status na Coleção</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Normal:</span>
                            <p className="text-white">{getCardQuantityInCollection(selectedCard.id, false)} cópias</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Foil:</span>
                            <p className="text-white">{getCardQuantityInCollection(selectedCard.id, true)} cópias</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Login Dialog */}
          <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">{isRegistering ? "Criar Conta" : "Entrar"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleLogin} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Nome Completo</label>
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={loginForm.name}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputClasses}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Senha</label>
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    className={inputClasses}
                    required
                  />
                </div>
                {isRegistering && (
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Confirmar Senha</label>
                    <Input
                      type="password"
                      placeholder="Confirme sua senha"
                      value={loginForm.confirmPassword}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      className={inputClasses}
                      required
                    />
                  </div>
                )}
                <div className="flex gap-2 justify-between items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={toggleAuthMode}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {isRegistering ? "Já tem conta? Entrar" : "Não tem conta? Registrar"}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLoginDialog(false)}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {loginLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : isRegistering ? (
                        "Criar Conta"
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Profile Dialog */}
          <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Perfil do Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`}
                    alt={currentUser?.name}
                    className="w-20 h-20 rounded-full border-2 border-emerald-500"
                  />
                  <div>
                    <h3 className="text-white text-xl font-medium">{currentUser?.name}</h3>
                    <p className="text-gray-400">{currentUser?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Nome</label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Sobrenome</label>
                    <Input
                      type="text"
                      placeholder="Seu sobrenome"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Bio</label>
                  <Textarea
                    placeholder="Conte um pouco sobre você..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                    className={inputClasses}
                    rows={3}
                  />
                </div>

                <div\
