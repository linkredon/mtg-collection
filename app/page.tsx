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
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Upload,
  FileText,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
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
  Filter,
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

export default function MTGCollectionManager() {
  const [allCards, setAllCards] = useState<MTGCard[]>([])
  const [ownedCardsMap, setOwnedCardsMap] = useState<Map<string, OwnedCard>>(new Map())
  const [filteredCards, setFilteredCards] = useState<MTGCard[]>([])
  const [visibleCount, setVisibleCount] = useState(25)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [collectionType, setCollectionType] = useState("")
  const [selectedCard, setSelectedCard] = useState<MTGCard | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [textView, setTextView] = useState(false)
  const [currentColumns, setCurrentColumns] = useState(7)
  const [hiddenSets, setHiddenSets] = useState<Set<string>>(new Set())
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [activeTab, setActiveTab] = useState("collection")

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

  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string>("")
  const [isLoadingBackground, setIsLoadingBackground] = useState(false)

  // Filter states
  const [ownershipFilter, setOwnershipFilter] = useState("all")
  const [sortBy, setSortBy] = useState("edition")
  const [sortAscending, setSortAscending] = useState(true)
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
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [filterName, setFilterName] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const columnOptions = [3, 5, 7]
  const abortControllerRef = useRef<AbortController | null>(null)
  const loadedTypesRef = useRef<Set<string>>(new Set()) // Para evitar recarregar o mesmo tipo

  const normalize = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

  // Função para simular preço baseado na raridade e tipo
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

  // Calcular estatísticas do dashboard
  const dashboardStats = useMemo(() => {
    const ownedCards = Array.from(ownedCardsMap.values())

    // Valor estimado total
    const totalValue = ownedCards.reduce((sum, ownedCard) => {
      const quantity = Number.parseInt(ownedCard.originalEntry.Quantity || "1", 10)
      const cardPrice = getEstimatedPrice(ownedCard.scryfallData)
      return sum + cardPrice * quantity
    }, 0)

    // Cartas únicas
    const uniqueCards = ownedCards.length

    // Total de cópias
    const totalCopies = ownedCards.reduce((sum, ownedCard) => {
      return sum + Number.parseInt(ownedCard.originalEntry.Quantity || "1", 10)
    }, 0)

    // Distribuição por tipo
    const typeDistribution: Record<string, number> = {}
    ownedCards.forEach((ownedCard) => {
      const types = ownedCard.scryfallData.type_line.split("—")[0].trim().split(" ")
      types.forEach((type) => {
        const cleanType = type.replace(/[^a-zA-Z]/g, "")
        if (cleanType) {
          typeDistribution[cleanType] = (typeDistribution[cleanType] || 0) + 1
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

    ownedCards.forEach((ownedCard) => {
      const colors = ownedCard.scryfallData.color_identity
      if (colors.length === 0) {
        colorDistribution.C += 1
      } else {
        colors.forEach((color) => {
          if (colorDistribution[color] !== undefined) {
            colorDistribution[color] += 1
          }
        })
      }
    })

    // Distribuição por raridade
    const rarityDistribution: Record<string, number> = {}
    ownedCards.forEach((ownedCard) => {
      const rarity = ownedCard.scryfallData.rarity
      rarityDistribution[rarity] = (rarityDistribution[rarity] || 0) + 1
    })

    // Distribuição por CMC
    const cmcDistribution: Record<number, number> = {}
    ownedCards.forEach((ownedCard) => {
      const cmc = ownedCard.scryfallData.cmc
      cmcDistribution[cmc] = (cmcDistribution[cmc] || 0) + 1
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
  }, [ownedCardsMap])

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

  const setCardQuantity = (cardId: string, quantity: number, isSideboard = false) => {
    setCurrentDeck((prev) => {
      const targetArray = isSideboard ? prev.sideboard : prev.mainboard
      let newArray

      if (quantity <= 0) {
        newArray = targetArray.filter((deckCard) => deckCard.card.id !== cardId)
      } else {
        const existingIndex = targetArray.findIndex((deckCard) => deckCard.card.id === cardId)
        if (existingIndex >= 0) {
          newArray = [...targetArray]
          newArray[existingIndex] = { ...newArray[existingIndex], quantity }
        } else {
          // Se não existe, não adiciona (só modifica existentes)
          newArray = targetArray
        }
      }

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

        // Procurar a carta na base de dados
        const foundCard = allCards.find((card) => normalize(card.name) === normalize(cardName))

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

  // Load saved background from localStorage and fetch new one if needed
  useEffect(() => {
    const savedBackground = localStorage.getItem("mtg-background-image")
    if (savedBackground) {
      setBackgroundImage(savedBackground)
    } else {
      fetchRandomBackground()
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
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("mtg-saved-filters", JSON.stringify(savedFilters))
  }, [savedFilters])

  useEffect(() => {
    localStorage.setItem("mtg-saved-decks", JSON.stringify(savedDecks))
  }, [savedDecks])

  // Função para salvar filtros atuais
  const saveCurrentFilters = () => {
    if (!filterName.trim()) {
      alert("Por favor, digite um nome para o filtro.")
      return
    }

    if (!collectionType) {
      alert("Selecione um tipo de coleção primeiro.")
      return
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      collectionType,
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

  const fetchCards = async (type: string) => {
    // Verificar se já carregou este tipo
    if (loadedTypesRef.current.has(type)) {
      console.log(`Tipo ${type} já foi carregado, ignorando`)
      return
    }

    // Evitar múltiplas chamadas simultâneas
    if (isLoadingCards) {
      console.log("Já está carregando cartas, ignorando nova chamada")
      return
    }

    console.log(`Iniciando carregamento de cartas para tipo: ${type}`)

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoadingCards(true)
    setLoading(true)
    setLoadingMessage(`Carregando cartas de ${type}...`)

    try {
      let url = `https://api.scryfall.com/cards/search?q=t:${type} game:paper&unique=prints`
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 50 // Limite de segurança para evitar loops infinitos
      const seenUrls = new Set<string>() // Para detectar URLs repetidas

      while (url && pageCount < maxPages) {
        // Verificar se foi cancelado
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Carregamento foi cancelado")
          return
        }

        // Verificar se já vimos esta URL (detectar loops)
        if (seenUrls.has(url)) {
          console.warn("URL repetida detectada, parando para evitar loop:", url)
          break
        }
        seenUrls.add(url)

        pageCount++
        setLoadingMessage(`Carregando ${type} (página ${pageCount})...`)
        console.log(`Carregando página ${pageCount} para ${type}`)

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          if (response.status === 404) {
            console.log("Nenhuma carta encontrada para este tipo")
            break
          }
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.data || data.data.length === 0) {
          console.log("Nenhum dado retornado, parando")
          break
        }

        const newCards = data.data.filter((c: MTGCard) => c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal)

        cards = cards.concat(newCards)
        console.log(`Página ${pageCount}: ${newCards.length} cartas, total: ${cards.length}`)

        // Verificar se há mais páginas
        if (!data.has_more || !data.next_page) {
          console.log("Não há mais páginas")
          break
        }

        url = data.next_page
        await new Promise((r) => setTimeout(r, 150)) // Delay entre requisições
      }

      if (pageCount >= maxPages) {
        console.warn("Limite máximo de páginas atingido")
      }

      // Verificar se foi cancelado antes de processar
      if (abortControllerRef.current?.signal.aborted) {
        console.log("Carregamento foi cancelado antes de processar")
        return
      }

      const sortedCards = cards.sort(
        (a, b) => new Date(a.released_at || 0).getTime() - new Date(b.released_at || 0).getTime(),
      )

      console.log(`Carregamento concluído: ${sortedCards.length} cartas de ${type}`)

      // Marcar como carregado
      loadedTypesRef.current.add(type)

      setAllCards(sortedCards)

      // Extrair opções de filtro
      const languages = Array.from(new Set(sortedCards.map((card) => card.lang).filter(Boolean))).sort()
      setAvailableLanguages(languages)

      const artists = Array.from(new Set(sortedCards.map((card) => card.artist).filter(Boolean))).sort()
      setAvailableArtists(artists)

      console.log(`${sortedCards.length} artes de ${type} carregadas.`)
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Requisição cancelada")
        return
      }
      console.error("Error loading cards:", error)
    } finally {
      setIsLoadingCards(false)
      setLoading(false)
      abortControllerRef.current = null
    }
  }

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

      // Simple CSV parsing - you might want to use a proper CSV parser
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      const nameIndex = headers.findIndex((h) => normalize(h).includes("name") || normalize(h).includes("nome"))

      if (nameIndex === -1) {
        console.log("Coluna de nome não encontrada no CSV.")
        return
      }

      const newOwnedCards = new Map<string, OwnedCard>()
      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        const cardName = values[nameIndex]

        if (!cardName) continue

        // Find matching card
        const matchingCard = allCards.find((card) => normalize(card.name) === normalize(cardName))

        if (matchingCard) {
          const entry: Record<string, string> = {}
          headers.forEach((header, idx) => {
            entry[header] = values[idx] || ""
          })

          newOwnedCards.set(matchingCard.id, {
            originalEntry: entry,
            scryfallData: matchingCard,
          })
          successCount++
        } else {
          errorCount++
        }
      }

      setOwnedCardsMap(newOwnedCards)
      console.log(`Processado. ${successCount} cartas carregadas. ${errorCount} falharam.`)
    } catch (error) {
      console.error("Error processing CSV:", error)
    } finally {
      setLoading(false)
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

  // Aplicar filtros - simplificado
  const applyFilters = () => {
    const filtered = allCards.filter((card) => {
      const owned = ownedCardsMap.has(card.id)

      // Ownership filter
      if (ownershipFilter === "owned" && !owned) return false
      if (ownershipFilter === "not-owned" && owned) return false

      // Hidden sets
      if (hiddenSets.has(card.set_name)) return false

      // Search filter (para deck builder, usar deckSearchQuery se estivermos na aba de deck)
      const searchTerm = activeTab === "deckbuilder" ? deckSearchQuery : searchQuery
      if (searchTerm && !normalize(card.name).includes(normalize(searchTerm))) return false

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

    // Sort
    filtered.sort((a, b) => {
      let valA: any, valB: any

      if (sortBy === "name") {
        valA = a.name
        valB = b.name
      } else {
        valA = new Date(a.released_at || 0)
        valB = new Date(b.released_at || 0)
      }

      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0
      return sortAscending ? comparison : -comparison
    })

    setFilteredCards(filtered)
  }

  // Effect para carregar cartas quando tipo muda - SIMPLIFICADO
  useEffect(() => {
    if (collectionType && !loadedTypesRef.current.has(collectionType) && !isLoadingCards) {
      console.log("useEffect: Carregando cartas para tipo:", collectionType)
      fetchCards(collectionType)
    }
  }, [collectionType]) // APENAS collectionType como dependência

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
    deckSearchQuery,
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
    activeTab,
  ])

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
  const groupedCards = visibleCards.reduce(
    (acc, card) => {
      const set = card.set_name || "Sem Edição"
      if (!acc[set]) acc[set] = []
      acc[set].push(card)
      return acc
    },
    {} as Record<string, MTGCard[]>,
  )

  // Classes padrão para inputs e selects (mesmo estilo do "Buscar cartas")
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
            <div className="flex items-center justify-center gap-4 mb-4">
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
            {isLoadingBackground && <p className="text-xs text-gray-400 mt-1">Carregando nova imagem...</p>}
            {backgroundImage && !isLoadingBackground && <p className="text-xs text-gray-500 mt-1">Background ativo</p>}
            <p className="text-gray-300">Gerencie sua coleção de Magic: The Gathering</p>
          </div>

          {/* Collection Type Selector */}
          <Card className="mb-6 bg-gray-800/70 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white">Tipo de Coleção</label>
                  <Select
                    value={collectionType}
                    onValueChange={(value) => {
                      console.log("Selecionando tipo:", value)
                      setCollectionType(value)
                    }}
                    disabled={isLoadingCards}
                  >
                    <SelectTrigger className={`w-48 ${selectClasses} ${isLoadingCards ? "opacity-50" : ""}`}>
                      <SelectValue placeholder="Selecione um tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="creature" className="text-white">
                        Criaturas
                      </SelectItem>
                      <SelectItem value="elf" className="text-white">
                        Elfos
                      </SelectItem>
                      <SelectItem value="dragon" className="text-white">
                        Dragões
                      </SelectItem>
                      <SelectItem value="angel" className="text-white">
                        Anjos
                      </SelectItem>
                      <SelectItem value="demon" className="text-white">
                        Demônios
                      </SelectItem>
                      <SelectItem value="artifact" className="text-white">
                        Artefatos
                      </SelectItem>
                      <SelectItem value="enchantment" className="text-white">
                        Encantamentos
                      </SelectItem>
                      <SelectItem value="instant" className="text-white">
                        Mágicas Instantâneas
                      </SelectItem>
                      <SelectItem value="sorcery" className="text-white">
                        Feitiçarias
                      </SelectItem>
                      <SelectItem value="planeswalker" className="text-white">
                        Planeswalkers
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white">Importar CSV</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                      disabled={loading || !collectionType}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {!collectionType && <p className="text-xs text-gray-400">Selecione um tipo de coleção primeiro</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Navigation */}
          {allCards.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800/70 border-gray-700 backdrop-blur-sm mb-6">
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

              {/* Deck Builder Tab */}
              <TabsContent value="deckbuilder" className="space-y-6">
                {/* Deck Builder Header */}
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Input
                          placeholder="Nome do Deck"
                          value={currentDeck.name}
                          onChange={(e) =>
                            setCurrentDeck((prev) => ({
                              ...prev,
                              name: e.target.value,
                              updatedAt: new Date().toISOString(),
                            }))
                          }
                          className={`${inputClasses} w-48`}
                        />
                        <Select
                          value={currentDeck.format}
                          onValueChange={(value) =>
                            setCurrentDeck((prev) => ({ ...prev, format: value, updatedAt: new Date().toISOString() }))
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
                            <SelectItem value="pauper" className="text-white">
                              Pauper
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={newDeck}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          Novo Deck
                        </Button>

                        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Importar Lista
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-white">Importar Lista de Deck</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-white mb-2 block">
                                  Cole sua lista de deck (formato: "4 Lightning Bolt")
                                </label>
                                <Textarea
                                  placeholder={`4 Lightning Bolt
2 Counterspell
1 Black Lotus

Sideboard:
3 Pyroblast
2 Red Elemental Blast`}
                                  value={deckImportText}
                                  onChange={(e) => setDeckImportText(e.target.value)}
                                  className={`${inputClasses} min-h-[200px]`}
                                />
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
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
                          onClick={() => {
                            const text = exportDeckToText()
                            navigator.clipboard.writeText(text)
                            alert("Lista copiada para a área de transferência!")
                          }}
                          className="bg-green-600 border-green-500 text-white hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exportar
                        </Button>

                        <Dialog open={showDeckSaveDialog} onOpenChange={setShowDeckSaveDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
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
                                <label className="text-sm font-medium text-white mb-2 block">
                                  Descrição (Opcional)
                                </label>
                                <Textarea
                                  value={currentDeck.description || ""}
                                  onChange={(e) => setCurrentDeck((prev) => ({ ...prev, description: e.target.value }))}
                                  className={inputClasses}
                                  placeholder="Descreva sua estratégia, combos, etc..."
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
                                <Button onClick={saveDeck} className="bg-purple-600 hover:bg-purple-700 text-white">
                                  Salvar Deck
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={showDeckLoadDialog} onOpenChange={setShowDeckLoadDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="bg-orange-600 border-orange-500 text-white hover:bg-orange-700"
                              disabled={savedDecks.length === 0}
                            >
                              <FolderOpen className="w-4 h-4 mr-2" />
                              Carregar ({savedDecks.length})
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl">
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
                                          <strong>Formato:</strong> {deck.format.toUpperCase()} •{" "}
                                          <strong>Cartas:</strong>{" "}
                                          {deck.mainboard.reduce((sum, card) => sum + card.quantity, 0)} •{" "}
                                          <strong>Criado:</strong>{" "}
                                          {new Date(deck.createdAt).toLocaleDateString("pt-BR")}
                                        </p>
                                        {deck.description && (
                                          <p className="text-xs text-gray-500 mb-2">{deck.description}</p>
                                        )}
                                        <div className="text-xs text-gray-500">
                                          <strong>Valor estimado:</strong> R${" "}
                                          {[...deck.mainboard, ...deck.sideboard]
                                            .reduce((sum, deckCard) => {
                                              return sum + getEstimatedPrice(deckCard.card) * deckCard.quantity
                                            }, 0)
                                            .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </div>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deck Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{deckStats.totalCards}</div>
                      <div className="text-sm text-gray-300">Cartas Principais</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {deckStats.totalCards >= 60 ? "✅ Legal" : "❌ Mínimo 60"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{deckStats.sideboardCards}</div>
                      <div className="text-sm text-gray-300">Sideboard</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {deckStats.sideboardCards <= 15 ? "✅ Legal" : "❌ Máximo 15"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        R$ {deckStats.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-300">Valor Estimado</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {Object.keys(deckStats.manaCurve).length > 0
                          ? Object.entries(deckStats.manaCurve).reduce(
                              (acc, [cmc, count]) => acc + Number.parseInt(cmc) * count,
                              0,
                            ) / deckStats.totalCards
                          : 0}
                      </div>
                      <div className="text-sm text-gray-300">CMC Médio</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Card Search and Collection */}
                  <div className="lg:col-span-2">
                    {/* Search Bar */}
                    <Card className="mb-4 bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-center">
                          <div className="flex-1">
                            <Input
                              placeholder="Buscar cartas para adicionar ao deck..."
                              value={deckSearchQuery}
                              onChange={(e) => setDeckSearchQuery(e.target.value)}
                              className={inputClasses}
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            <Filter className="w-4 h-4 mr-2" />
                            Filtros
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                      <Card className="mb-4 bg-gray-800/90 border-gray-600 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <Select value={rarityFilter} onValueChange={setRarityFilter}>
                              <SelectTrigger className={selectClasses}>
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
                              className={inputClasses}
                              type="number"
                              min="0"
                            />

                            <Input
                              placeholder="Poder"
                              value={powerFilter}
                              onChange={(e) => setPowerFilter(e.target.value)}
                              className={inputClasses}
                            />

                            <Input
                              placeholder="Resistência"
                              value={toughnessFilter}
                              onChange={(e) => setToughnessFilter(e.target.value)}
                              className={inputClasses}
                            />
                          </div>

                          {/* Color Filters */}
                          <div className="mt-4">
                            <label className="text-sm font-medium text-white mb-2 block">Cores</label>
                            <div className="flex gap-2">
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
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleColor(color)}
                                  className={`p-2 transition-all ${
                                    activeColors.has(color)
                                      ? "bg-blue-600 border-blue-400 shadow-lg scale-105"
                                      : "bg-gray-700 border-gray-500 opacity-40 hover:opacity-70"
                                  }`}
                                  title={name}
                                >
                                  <img
                                    src={`https://svgs.scryfall.io/card-symbols/${color}.svg`}
                                    alt={name}
                                    className="w-4 h-4"
                                  />
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {visibleCards.slice(0, 50).map((card) => {
                        const imageUrl = getOptimizedImageUrl(card, true)
                        const owned = ownedCardsMap.has(card.id)

                        return (
                          <div
                            key={card.id}
                            className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105 hover:z-10"
                          >
                            <div className="aspect-[63/88] rounded-lg overflow-hidden shadow-lg ring-2 ring-transparent hover:ring-blue-400/50 transition-all">
                              <img
                                src={imageUrl || "/placeholder.svg"}
                                alt={card.name}
                                className={`w-full h-full object-cover transition-all duration-200 ${
                                  !owned ? "grayscale brightness-75" : ""
                                }`}
                                loading="lazy"
                                onClick={() => setSelectedCard(card)}
                              />
                            </div>

                            {/* Add to Deck Buttons */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => addCardToDeck(card, 1, false)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                                  title="Adicionar ao deck principal"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => addCardToDeck(card, 1, true)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                                  title="Adicionar ao sideboard"
                                >
                                  SB
                                </Button>
                              </div>
                            </div>

                            {owned && (
                              <div className="absolute top-1 right-1">
                                <Badge className="bg-emerald-600 text-white shadow-lg text-xs">
                                  <CheckCircle className="w-2 h-2" />
                                </Badge>
                              </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-xs font-medium truncate">{card.name}</p>
                              <div
                                className="flex items-center gap-1 justify-center"
                                dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Load More Button */}
                    {visibleCount < filteredCards.length && (
                      <div className="text-center mt-4">
                        <Button
                          onClick={() => setVisibleCount((prev) => prev + 50)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Mostrar Mais Cartas
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Deck List and Stats */}
                  <div className="lg:col-span-1">
                    {/* Current Deck */}
                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm mb-4">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Lista do Deck</CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-96 overflow-y-auto">
                        {/* Mainboard */}
                        {currentDeck.mainboard.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-white font-medium text-sm mb-2 border-b border-gray-600 pb-1">
                              Mainboard ({deckStats.totalCards})
                            </h4>
                            <div className="space-y-1">
                              {currentDeck.mainboard
                                .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="flex items-center justify-between bg-gray-700/50 p-2 rounded text-sm"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-white font-medium w-6">{deckCard.quantity}x</span>
                                      <span className="text-gray-300 truncate flex-1">{deckCard.card.name}</span>
                                      <div
                                        className="flex items-center gap-1"
                                        dangerouslySetInnerHTML={{
                                          __html: formatManaSymbols(deckCard.card.mana_cost || ""),
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeCardFromDeck(deckCard.card.id, 1, false)}
                                        className="bg-red-600 border-red-500 text-white hover:bg-red-700 w-6 h-6 p-0"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addCardToDeck(deckCard.card, 1, false)}
                                        className="bg-green-600 border-green-500 text-white hover:bg-green-700 w-6 h-6 p-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Sideboard */}
                        {currentDeck.sideboard.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium text-sm mb-2 border-b border-gray-600 pb-1">
                              Sideboard ({deckStats.sideboardCards})
                            </h4>
                            <div className="space-y-1">
                              {currentDeck.sideboard
                                .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <div
                                    key={deckCard.card.id}
                                    className="flex items-center justify-between bg-blue-700/30 p-2 rounded text-sm"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-white font-medium w-6">{deckCard.quantity}x</span>
                                      <span className="text-gray-300 truncate flex-1">{deckCard.card.name}</span>
                                      <div
                                        className="flex items-center gap-1"
                                        dangerouslySetInnerHTML={{
                                          __html: formatManaSymbols(deckCard.card.mana_cost || ""),
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeCardFromDeck(deckCard.card.id, 1, true)}
                                        className="bg-red-600 border-red-500 text-white hover:bg-red-700 w-6 h-6 p-0"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addCardToDeck(deckCard.card, 1, true)}
                                        className="bg-green-600 border-green-500 text-white hover:bg-green-700 w-6 h-6 p-0"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {currentDeck.mainboard.length === 0 && currentDeck.sideboard.length === 0 && (
                          <p className="text-gray-400 text-center py-4">
                            Seu deck está vazio. Clique nas cartas acima para adicioná-las!
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Deck Analytics */}
                    {(currentDeck.mainboard.length > 0 || currentDeck.sideboard.length > 0) && (
                      <div className="space-y-4">
                        <SimpleBarChart
                          data={deckStats.manaCurve}
                          title="Curva de Mana"
                          colorMap={{
                            "0": "#6b7280",
                            "1": "#3b82f6",
                            "2": "#10b981",
                            "3": "#f59e0b",
                            "4": "#ef4444",
                            "5": "#8b5cf6",
                            "6": "#ec4899",
                            "7": "#14b8a6",
                          }}
                        />

                        <SimpleBarChart
                          data={deckStats.colorDistribution}
                          title="Distribuição por Cor"
                          colorMap={colorMap}
                        />

                        <SimpleBarChart data={deckStats.typeDistribution} title="Distribuição por Tipo" />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Coins className="h-8 w-8 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-400">Valor Estimado</p>
                          <p className="text-2xl font-bold text-white">
                            R$ {dashboardStats.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Library className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-400">Cartas Únicas</p>
                          <p className="text-2xl font-bold text-white">{dashboardStats.uniqueCards}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <Copy className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-400">Total de Cópias</p>
                          <p className="text-2xl font-bold text-white">{dashboardStats.totalCopies}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-400">Valor Médio</p>
                          <p className="text-2xl font-bold text-white">
                            R${" "}
                            {dashboardStats.uniqueCards > 0
                              ? (dashboardStats.totalValue / dashboardStats.totalCopies).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                })
                              : "0,00"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SimpleBarChart
                    data={dashboardStats.colorDistribution}
                    title="Distribuição por Cor"
                    colorMap={colorMap}
                  />

                  <SimpleBarChart
                    data={dashboardStats.rarityDistribution}
                    title="Distribuição por Raridade"
                    colorMap={rarityColorMap}
                  />

                  <SimpleBarChart data={dashboardStats.typeDistribution} title="Distribuição por Tipo" />

                  <SimpleBarChart data={dashboardStats.cmcDistribution} title="Distribuição por CMC" />
                </div>

                {/* Collection Progress */}
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Progresso da Coleção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">Cartas Coletadas</span>
                          <span className="text-white">
                            {stats.ownedArtworks} / {stats.total} (
                            {((stats.ownedArtworks / stats.total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={(stats.ownedArtworks / stats.total) * 100} className="h-3 bg-gray-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Collection Tab */}
              <TabsContent value="collection" className="space-y-6">
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

                      <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                        <SelectTrigger className={`w-40 ${selectClasses}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="all" className="text-white">
                            Todas
                          </SelectItem>
                          <SelectItem value="owned" className="text-white">
                            Possuídas
                          </SelectItem>
                          <SelectItem value="not-owned" className="text-white">
                            Não Possuídas
                          </SelectItem>
                        </SelectContent>
                      </Select>

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

                    <div className="flex justify-center mt-4 gap-2">
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
                            disabled={!collectionType}
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
                                <strong>Tipo:</strong> {collectionType || "Nenhum"}
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
                                variant="outline"
                                size="sm"
                                onClick={() => toggleColor(color)}
                                className={`p-2 transition-all ${
                                  activeColors.has(color)
                                    ? "bg-blue-600 border-blue-400 shadow-lg scale-105"
                                    : "bg-gray-700 border-gray-500 opacity-40 hover:opacity-70"
                                }`}
                                title={name}
                              >
                                <img
                                  src={`https://svgs.scryfall.io/card-symbols/${color}.svg`}
                                  alt={name}
                                  className="w-4 h-4"
                                />
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Filter Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Raridade</label>
                            <Select value={rarityFilter} onValueChange={setRarityFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue placeholder="Todas" />
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
                            <label className="text-sm font-medium text-white mb-2 block">Custo Convertido</label>
                            <Input
                              placeholder="CMC"
                              value={cmcFilter}
                              onChange={(e) => setCmcFilter(e.target.value)}
                              className={inputClasses}
                              type="number"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Poder</label>
                            <Input
                              placeholder="Poder"
                              value={powerFilter}
                              onChange={(e) => setPowerFilter(e.target.value)}
                              className={inputClasses}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Resistência</label>
                            <Input
                              placeholder="Resistência"
                              value={toughnessFilter}
                              onChange={(e) => setToughnessFilter(e.target.value)}
                              className={inputClasses}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Foil/Normal</label>
                            <Select value={foilFilter} onValueChange={setFoilFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                <SelectItem value="all" className="text-white">
                                  Todos
                                </SelectItem>
                                <SelectItem value="foil" className="text-white">
                                  Apenas Foil
                                </SelectItem>
                                <SelectItem value="nonfoil" className="text-white">
                                  Apenas Normal
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Idioma</label>
                            <Select value={languageFilter} onValueChange={setLanguageFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                                <SelectItem value="all" className="text-white">
                                  Todos
                                </SelectItem>
                                {availableLanguages.map((lang) => (
                                  <SelectItem key={lang} value={lang} className="text-white">
                                    {new Intl.DisplayNames(["pt-BR"], { type: "language" }).of(lang) || lang}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Artista</label>
                            <Select value={artistFilter} onValueChange={setArtistFilter}>
                              <SelectTrigger className={selectClasses}>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600 max-h-60">
                                <SelectItem value="all" className="text-white">
                                  Todos
                                </SelectItem>
                                {availableArtists.map((artist) => (
                                  <SelectItem key={artist} value={artist} className="text-white">
                                    {artist}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-white mb-2 block">Buscar no Texto</label>
                            <Input
                              placeholder="Texto da carta..."
                              value={oracleTextFilter}
                              onChange={(e) => setOracleTextFilter(e.target.value)}
                              className={inputClasses}
                            />
                          </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-center pt-4 border-t border-gray-600">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRarityFilter("all")
                              setCmcFilter("")
                              setPowerFilter("")
                              setToughnessFilter("")
                              setFoilFilter("all")
                              setLanguageFilter("all")
                              setArtistFilter("all")
                              setOracleTextFilter("")
                              setActiveColors(new Set(["W", "U", "B", "R", "G", "C"]))
                            }}
                            className="bg-gray-700 border-gray-500 text-white hover:bg-gray-600"
                          >
                            Limpar Filtros Avançados
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats - só aparece se tiver cartas carregadas */}
                <Card className="mb-6 bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                        <div className="text-sm text-gray-300">Total de Artes</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-cyan-400">{stats.ownedArtworks}</div>
                        <div className="text-sm text-gray-300">Artes Possuídas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-400">{stats.totalCopies}</div>
                        <div className="text-sm text-gray-300">Cópias Totais</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-400">{stats.missing}</div>
                        <div className="text-sm text-gray-300">Artes Faltantes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* View Controls */}
                <div className="flex justify-center gap-2 mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setTextView(!textView)}
                    className={`${textView ? "bg-emerald-600 text-white" : "bg-gray-700 text-white"} border-gray-600 hover:bg-emerald-700`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Texto
                  </Button>

                  <Button
                    variant="outline"
                    onClick={cycleColumns}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    <Grid3X3 className="w-4 h-4 mr-2" />
                    {currentColumns} Colunas
                  </Button>
                </div>

                {/* Cards Display */}
                {textView ? (
                  <Card className="bg-gray-800/90 border-gray-600 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {visibleCards.map((card) => {
                          const owned = ownedCardsMap.has(card.id)
                          const quantity = owned ? ownedCardsMap.get(card.id)?.originalEntry.Quantity || "1" : "0"

                          return (
                            <div
                              key={card.id}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-opacity-80 ${
                                owned
                                  ? "bg-emerald-900/40 border-emerald-700/50 hover:bg-emerald-900/60"
                                  : "bg-gray-700/40 border-gray-600/50 hover:bg-gray-700/60"
                              }`}
                              onClick={() => setSelectedCard(card)}
                            >
                              <div className="flex-grow">
                                <span className="font-bold text-white">{card.name}</span>
                                <span className="text-gray-200 text-sm ml-2">({card.set_name})</span>
                                <div className="text-xs text-gray-300 mt-1">{card.type_line}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div
                                  className="flex items-center gap-1"
                                  dangerouslySetInnerHTML={{ __html: formatManaSymbols(card.mana_cost || "") }}
                                />
                                <Badge
                                  variant={owned ? "default" : "destructive"}
                                  className={owned ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}
                                >
                                  {owned ? `✅ ${quantity}x` : "❌"}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedCards).map(([setName, cards]) => (
                      <Card key={setName} className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-emerald-500 pl-3">
                            {setName}
                          </h3>
                          <div className={`grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-${currentColumns}`}>
                            {cards.map((card) => {
                              const owned = ownedCardsMap.has(card.id)
                              const imageUrl = getOptimizedImageUrl(card, true)

                              return (
                                <div
                                  key={card.id}
                                  className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105 hover:z-10"
                                  onClick={() => setSelectedCard(card)}
                                >
                                  <div className="aspect-[63/88] rounded-lg overflow-hidden shadow-lg ring-2 ring-transparent hover:ring-blue-400/50 transition-all">
                                    <img
                                      src={imageUrl || "/placeholder.svg"}
                                      alt={card.name}
                                      className={`w-full h-full object-cover transition-all duration-200 ${
                                        !owned ? "grayscale brightness-75" : ""
                                      }`}
                                      loading="lazy"
                                    />
                                  </div>
                                  {owned && (
                                    <div className="absolute top-2 right-2">
                                      <Badge className="bg-emerald-600 text-white shadow-lg">
                                        <CheckCircle className="w-3 h-3" />
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs font-medium truncate">{card.name}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Load More Button */}
                {visibleCount < filteredCards.length && (
                  <div className="text-center mt-8">
                    <Button
                      onClick={() => setVisibleCount((prev) => prev + 50)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Mostrar Mais
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="text-center bg-gray-900 p-8 rounded-lg border border-gray-700">
                <Loader2 className="w-12 h-12 animate-spin text-white mb-4 mx-auto" />
                <p className="text-white text-lg mb-4">{loadingMessage}</p>
                {isLoadingCards && (
                  <Button
                    variant="outline"
                    onClick={cancelLoading}
                    className="bg-red-600 border-red-500 text-white hover:bg-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Carregamento
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Welcome Message - aparece quando não há cartas carregadas */}
          {!loading && allCards.length === 0 && (
            <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-4">Bem-vindo ao Gerenciador de Coleção MTG!</h3>
                <p className="text-gray-300 mb-4">
                  Para começar, selecione um tipo de coleção acima. As cartas serão carregadas automaticamente.
                </p>
                <p className="text-gray-400 text-sm">
                  Após carregar as cartas, você poderá importar sua coleção via CSV e usar os filtros avançados.
                </p>
                {savedFilters.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <p className="text-blue-300 text-sm">
                      💡 Você tem {savedFilters.length} filtro(s) salvo(s). Selecione um tipo de coleção e clique em
                      "Carregar Filtros" para usá-los.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Details Modal */}
          <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
              {selectedCard && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-white">{selectedCard.name}</DialogTitle>
                  </DialogHeader>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={getOptimizedImageUrl(selectedCard, false) || "/placeholder.svg"}
                        alt={selectedCard.name}
                        className="w-full rounded-lg shadow-lg"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Edição:</span>
                          <p className="text-white font-medium">{selectedCard.set_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Raridade:</span>
                          <p className="text-white font-medium capitalize">{selectedCard.rarity}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">CMC:</span>
                          <p className="text-white font-medium">{selectedCard.cmc}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Artista:</span>
                          <p className="text-white font-medium">{selectedCard.artist}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400">Tipo:</span>
                        <p className="text-white font-medium">{selectedCard.type_line}</p>
                      </div>

                      {selectedCard.oracle_text && (
                        <div>
                          <span className="text-gray-400">Texto:</span>
                          <div
                            className="text-white mt-1 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: formatManaSymbols(selectedCard.oracle_text.replace(/\n/g, "<br>")),
                            }}
                          />
                        </div>
                      )}

                      {selectedCard.power && selectedCard.toughness && (
                        <div>
                          <span className="text-gray-400">Poder/Resistência:</span>
                          <p className="text-white font-bold text-lg">
                            {selectedCard.power}/{selectedCard.toughness}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-700">
                        {ownedCardsMap.has(selectedCard.id) ? (
                          <Badge className="bg-emerald-600 text-white">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Possuída ({ownedCardsMap.get(selectedCard.id)?.originalEntry.Quantity || "1"}x)
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-600 text-white">
                            <XCircle className="w-4 h-4 mr-2" />
                            Não Possuída
                          </Badge>
                        )}
                      </div>

                      {/* Add to Deck Buttons */}
                      {activeTab === "deckbuilder" && (
                        <div className="pt-4 border-t border-gray-700">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => addCardToDeck(selectedCard, 1, false)}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar ao Deck
                            </Button>
                            <Button
                              onClick={() => addCardToDeck(selectedCard, 1, true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar ao Sideboard
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
