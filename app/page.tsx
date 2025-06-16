"use client"

import React from "react"

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

const cardTypes = [
  { value: "creature", label: "Criaturas" },
  { value: "land", label: "Terrenos" },
  { value: "artifact", label: "Artefatos" },
  { value: "enchantment", label: "Encantamentos" },
  { value: "instant", label: "Mágicas Instantâneas" },
  { value: "sorcery", label: "Feitiçarias" },
  { value: "planeswalker", label: "Planeswalkers" },
  { value: "elf", label: "Elfos" },
  { value: "dragon", label: "Dragões" },
  { value: "angel", label: "Anjos" },
  { value: "demon", label: "Demônios" },
  { value: "vampire", label: "Vampiros" },
  { value: "zombie", label: "Zumbis" },
  { value: "goblin", label: "Goblins" },
  { value: "human", label: "Humanos" },
  { value: "spirit", label: "Espíritos" },
  { value: "beast", label: "Bestas" },
  { value: "elemental", label: "Elementais" },
]

function MTGCollectionManager() {
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
  const loadedTypesRef = useRef<Set<string>>(new Set())

  const normalize = (str: string | null | undefined) => {
    if (!str || typeof str !== "string") return ""
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

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
      let url = "https://api.scryfall.com/cards/search?q=game:paper&unique=prints&order=released"
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 20 // Limite para não carregar demais

      while (url && pageCount < maxPages) {
        // Verificar se foi cancelado
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Carregamento foi cancelado")
          return
        }

        pageCount++
        setLoadingMessage(`Carregando cartas (página ${pageCount})...`)
        console.log(`Carregando página ${pageCount}`)

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
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

      // Verificar se foi cancelado antes de processar
      if (abortControllerRef.current?.signal.aborted) {
        console.log("Carregamento foi cancelado antes de processar")
        return
      }

      const sortedCards = cards.sort(
        (a, b) => new Date(a.released_at || 0).getTime() - new Date(b.released_at || 0).getTime(),
      )

      console.log(`Carregamento concluído: ${sortedCards.length} cartas`)

      setAllCards(sortedCards)

      // Extrair opções de filtro
      const languages = Array.from(new Set(sortedCards.map((card) => card.lang).filter(Boolean))).sort()
      setAvailableLanguages(languages)

      const artists = Array.from(new Set(sortedCards.map((card) => card.artist).filter(Boolean))).sort()
      setAvailableArtists(artists)

      console.log(`${sortedCards.length} cartas carregadas.`)
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

  // Função para carregar cartas para o deck builder (todas as cartas)
  const fetchDeckBuilderCards = async () => {
    if (deckBuilderCards.length > 0) {
      console.log("Cartas do deck builder já carregadas")
      return
    }

    setIsSearchingCards(true)
    setLoadingMessage("Carregando cartas para o deck builder...")

    try {
      let url = "https://api.scryfall.com/cards/search?q=game:paper&unique=cards&order=name"
      let cards: MTGCard[] = []
      let pageCount = 0
      const maxPages = 30 // Limite para deck builder

      while (url && pageCount < maxPages) {
        pageCount++
        console.log(`Carregando página ${pageCount} para deck builder`)

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.data || data.data.length === 0) {
          break
        }

        const newCards = data.data.filter((c: MTGCard) => c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal)
        cards = cards.concat(newCards)

        if (!data.has_more || !data.next_page) {
          break
        }

        url = data.next_page
        await new Promise((r) => setTimeout(r, 100))
      }

      setDeckBuilderCards(cards)
      console.log(`${cards.length} cartas carregadas para o deck builder`)
    } catch (error) {
      console.error("Erro ao carregar cartas do deck builder:", error)
    } finally {
      setIsSearchingCards(false)
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

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const nameIndex = headers.findIndex((h) => {
        if (!h || typeof h !== "string") return false
        const normalized = normalize(h)
        return normalized.includes("name") || normalized.includes("nome")
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
      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
        const cardName = values[nameIndex]
        const cardSet = setIndex >= 0 ? values[setIndex] : ""

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
          successCount++
        } else {
          errorCount++
          console.log(`Carta não encontrada: ${cardName}`)
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

  // Function to group and render mainboard cards
  const renderMainboardCards = () => {
    // Group cards by type
    const groupedCards = currentDeck.mainboard.reduce(
      (acc, deckCard) => {
        const type = deckCard.card.type_line.split("—")[0].trim().split(" ")[0] || "Other"
        if (!acc[type]) acc[type] = []
        acc[type].push(deckCard)
        return acc
      },
      {} as Record<string, DeckCard[]>,
    )

    // Sort types by priority
    const typeOrder = ["Creature", "Planeswalker", "Instant", "Sorcery", "Artifact", "Enchantment", "Land"]
    const sortedTypes = Object.keys(groupedCards).sort((a, b) => {
      const aIndex = typeOrder.indexOf(a)
      const bIndex = typeOrder.indexOf(b)
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    return sortedTypes.map((type) => (
      <React.Fragment key={type}>
        <tr className="bg-gray-700/10">
          <td colSpan={6} className="px-3 py-2">
            <span className="text-gray-300 font-medium text-sm uppercase tracking-wide">
              {type} ({groupedCards[type].reduce((sum, card) => sum + card.quantity, 0)})
            </span>
          </td>
        </tr>
        {groupedCards[type]
          .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name))
          .map((deckCard) => (
            <tr key={deckCard.card.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCardFromDeck(deckCard.card.id, 1, false)}
                    className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-white font-medium w-8 text-center">{deckCard.quantity}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addCardToDeck(deckCard.card, 1, false)}
                    className="w-6 h-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </td>
              <td className="p-3">
                <button
                  onClick={() => setSelectedCard(deckCard.card)}
                  className="text-white hover:text-emerald-400 font-medium text-left"
                >
                  {deckCard.card.name}
                </button>
              </td>
              <td className="p-3">
                <span
                  className="text-gray-300 text-sm"
                  dangerouslySetInnerHTML={{ __html: formatManaSymbols(deckCard.card.mana_cost || "") }}
                />
              </td>
              <td className="p-3 text-gray-300 text-sm">{deckCard.card.type_line.split("—")[0].trim()}</td>
              <td className="p-3 text-right text-gray-300 text-sm">
                R$ {(getEstimatedPrice(deckCard.card) * deckCard.quantity).toFixed(2)}
              </td>
              <td className="p-3 text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCardQuantity(deckCard.card.id, 0, false)}
                  className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </td>
            </tr>
          ))}
      </React.Fragment>
    ))
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

                    {/* Botão de Importar CSV movido para cá */}
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

                      {/* Collection Type Filter - movido para dentro dos filtros avançados */}
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

              {/* Stats */}
              {!loading && !isLoadingCards && allCards.length > 0 && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-emerald-400">{stats.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Total de Cartas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-400">{stats.ownedArtworks.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Artes Possuídas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-400">{stats.totalCopies.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Total de Cópias</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-400">{stats.missing.toLocaleString()}</p>
                        <p className="text-sm text-gray-400">Faltando</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Controls */}
              {!loading && !isLoadingCards && filteredCards.length > 0 && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTextView(!textView)}
                          className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                        >
                          {textView ? <Grid3X3 className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                          {textView ? "Grade" : "Lista"}
                        </Button>

                        {!textView && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cycleColumns}
                            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            <Grid3X3 className="w-4 h-4 mr-2" />
                            {currentColumns} Colunas
                          </Button>
                        )}
                      </div>

                      <div className="text-sm text-gray-400">
                        Mostrando {Math.min(visibleCount, filteredCards.length)} de {filteredCards.length} cartas
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cards Display */}
              {!loading && !isLoadingCards && filteredCards.length > 0 && (
                <div className="space-y-6">
                  {textView ? (
                    // Text View
                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-700/50">
                              <tr>
                                <th className="text-left p-3 text-white font-medium">Nome</th>
                                <th className="text-left p-3 text-white font-medium">Edição</th>
                                <th className="text-left p-3 text-white font-medium">Raridade</th>
                                <th className="text-left p-3 text-white font-medium">CMC</th>
                                <th className="text-left p-3 text-white font-medium">Tipo</th>
                                <th className="text-center p-3 text-white font-medium">Possuída</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visibleCards.map((card) => {
                                const owned = ownedCardsMap.has(card.id)
                                const ownedCard = ownedCardsMap.get(card.id)
                                const quantity = ownedCard
                                  ? Number.parseInt(ownedCard.originalEntry.Quantity || "1", 10)
                                  : 0

                                return (
                                  <tr
                                    key={card.id}
                                    className="border-b border-gray-600 hover:bg-gray-700/30 cursor-pointer"
                                    onClick={() => setSelectedCard(card)}
                                  >
                                    <td className="p-3 text-white font-medium">{card.name}</td>
                                    <td className="p-3 text-gray-300">{card.set_name}</td>
                                    <td className="p-3">
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          card.rarity === "mythic"
                                            ? "border-orange-500 text-orange-400"
                                            : card.rarity === "rare"
                                              ? "border-yellow-500 text-yellow-400"
                                              : card.rarity === "uncommon"
                                                ? "border-gray-400 text-gray-300"
                                                : "border-gray-600 text-gray-400"
                                        }`}
                                      >
                                        {card.rarity}
                                      </Badge>
                                    </td>
                                    <td className="p-3 text-gray-300">{card.cmc}</td>
                                    <td className="p-3 text-gray-300">{card.type_line}</td>
                                    <td className="p-3 text-center">
                                      {owned ? (
                                        <div className="flex items-center justify-center gap-2">
                                          <CheckCircle className="w-5 h-5 text-green-400" />
                                          {quantity > 1 && (
                                            <Badge variant="secondary" className="bg-green-600 text-white">
                                              {quantity}x
                                            </Badge>
                                          )}
                                        </div>
                                      ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Grid View
                    Object.entries(groupedCards).map(([setName, setCards]) => (
                      <Card key={setName} className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white text-lg">{setName}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-gray-500 text-gray-300">
                                {setCards.length} cartas
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newHidden = new Set(hiddenSets)
                                  if (newHidden.has(setName)) {
                                    newHidden.delete(setName)
                                  } else {
                                    newHidden.add(setName)
                                  }
                                  setHiddenSets(newHidden)
                                }}
                                className="text-gray-400 hover:text-white"
                              >
                                {hiddenSets.has(setName) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronUp className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        {!hiddenSets.has(setName) && (
                          <CardContent>
                            <div
                              className="grid gap-4"
                              style={{
                                gridTemplateColumns: `repeat(${currentColumns}, minmax(0, 1fr))`,
                              }}
                            >
                              {setCards.map((card) => {
                                const owned = ownedCardsMap.has(card.id)
                                const ownedCard = ownedCardsMap.get(card.id)
                                const quantity = ownedCard
                                  ? Number.parseInt(ownedCard.originalEntry.Quantity || "1", 10)
                                  : 0

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
                                        className="w-full h-auto rounded-lg shadow-lg"
                                        loading="lazy"
                                      />
                                      {owned && (
                                        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                          <CheckCircle className="w-4 h-4" />
                                        </div>
                                      )}
                                      {quantity > 1 && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                                          {quantity}x
                                        </div>
                                      )}
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center p-2">
                                        <p className="font-bold text-sm">{card.name}</p>
                                        <p className="text-xs">{card.set_name}</p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  )}

                  {/* Load More Button */}
                  {visibleCount < filteredCards.length && (
                    <div className="text-center">
                      <Button
                        onClick={() => setVisibleCount((prev) => prev + 25)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Carregar Mais ({filteredCards.length - visibleCount} restantes)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {!loading && !isLoadingCards && allCards.length > 0 && filteredCards.length === 0 && (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400 text-lg">Nenhuma carta encontrada com os filtros atuais.</p>
                  </CardContent>
                </Card>
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
              {ownedCardsMap.size === 0 ? (
                <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-400 text-lg mb-4">Importe sua coleção para ver estatísticas detalhadas.</p>
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
                          R$ {(dashboardStats.totalValue / dashboardStats.uniqueCards).toFixed(2)}
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

                      <Textarea
                        placeholder="Descrição do deck..."
                        value={currentDeck.description || ""}
                        onChange={(e) => setCurrentDeck((prev) => ({ ...prev, description: e.target.value }))}
                        className={`${inputClasses} bg-transparent border-none p-0 resize-none`}
                        rows={2}
                      />

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
                                        <strong>Formato:</strong> {deck.format?.toUpperCase()} •{" "}
                                        <strong>Cartas:</strong>{" "}
                                        {deck.mainboard.reduce((sum, card) => sum + card.quantity, 0)}
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
                              <label className="text-sm font-medium text-white mb-2 block">Cole a lista do deck</label>
                              <Textarea
                                value={deckImportText}
                                onChange={(e) => setDeckImportText(e.target.value)}
                                className={inputClasses}
                                rows={10}
                                placeholder={`4 Lightning Bolt\n2 Counterspell\n1 Black Lotus\n\nSideboard:\n3 Pyroblast\n2 Red Elemental Blast`}
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
                          const text = exportDeckToText()
                          navigator.clipboard.writeText(text)
                          console.log("Lista do deck copiada!")
                        }}
                        className="bg-orange-600 border-orange-500 text-white hover:bg-orange-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Deck Lists */}
                <div className="col-span-12 xl:col-span-8 space-y-6">
                  {/* Mainboard */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-xl">Mainboard ({deckStats.totalCards})</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <Grid3X3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {currentDeck.mainboard.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-700/30 border-b border-gray-600">
                              <tr>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Qtd</th>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Nome</th>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Custo</th>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Tipo</th>
                                <th className="text-right p-3 text-gray-300 font-medium text-sm">Preço</th>
                                <th className="text-center p-3 text-gray-300 font-medium text-sm w-20">Ações</th>
                              </tr>
                            </thead>
                            <tbody>{renderMainboardCards()}</tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-gray-400 text-lg mb-2">Mainboard vazio</p>
                          <p className="text-gray-500 text-sm">Use a busca para adicionar cartas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sideboard */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-xl">Sideboard ({deckStats.sideboardCards})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {currentDeck.sideboard.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-700/30 border-b border-gray-600">
                              <tr>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Qtd</th>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Nome</th>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Custo</th>
                                <th className="text-left p-3 text-gray-300 font-medium text-sm">Tipo</th>
                                <th className="text-right p-3 text-gray-300 font-medium text-sm">Preço</th>
                                <th className="text-center p-3 text-gray-300 font-medium text-sm w-20">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentDeck.sideboard
                                .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name))
                                .map((deckCard) => (
                                  <tr
                                    key={deckCard.card.id}
                                    className="border-b border-gray-700/30 hover:bg-gray-700/20"
                                  >
                                    <td className="p-3">
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeCardFromDeck(deckCard.card.id, 1, true)}
                                          className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="text-white font-medium w-8 text-center">
                                          {deckCard.quantity}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => addCardToDeck(deckCard.card, 1, true)}
                                          className="w-6 h-6 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <button
                                        onClick={() => setSelectedCard(deckCard.card)}
                                        className="text-white hover:text-emerald-400 font-medium text-left"
                                      >
                                        {deckCard.card.name}
                                      </button>
                                    </td>
                                    <td className="p-3">
                                      <span
                                        className="text-gray-300 text-sm"
                                        dangerouslySetInnerHTML={{
                                          __html: formatManaSymbols(deckCard.card.mana_cost || ""),
                                        }}
                                      />
                                    </td>
                                    <td className="p-3 text-gray-300 text-sm">
                                      {deckCard.card.type_line.split("—")[0].trim()}
                                    </td>
                                    <td className="p-3 text-right text-gray-300 text-sm">
                                      R$ {(getEstimatedPrice(deckCard.card) * deckCard.quantity).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setCardQuantity(deckCard.card.id, 0, true)}
                                        className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-gray-400 text-lg mb-2">Sideboard vazio</p>
                          <p className="text-gray-500 text-sm">Use a busca para adicionar cartas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Visual Card Gallery */}
                  {(currentDeck.mainboard.length > 0 || currentDeck.sideboard.length > 0) && (
                    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-white text-xl">Galeria de Cartas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                          {[...currentDeck.mainboard, ...currentDeck.sideboard]
                            .sort((a, b) => a.card.cmc - b.card.cmc || a.card.name.localeCompare(b.card.name))
                            .map((deckCard) => (
                              <div key={deckCard.card.id} className="relative group">
                                <img
                                  src={getOptimizedImageUrl(deckCard.card, true) || "/placeholder.svg"}
                                  alt={deckCard.card.name}
                                  className="w-full h-auto rounded cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => setSelectedCard(deckCard.card)}
                                />
                                {deckCard.quantity > 1 && (
                                  <div className="absolute top-1 right-1 bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    {deckCard.quantity}
                                  </div>
                                )}
                                {deckCard.isSideboard && (
                                  <div className="absolute bottom-1 left-1 bg-blue-600 text-white rounded px-1 text-xs">
                                    SB
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Statistics and Search */}
                <div className="col-span-12 xl:col-span-4 space-y-6">
                  {/* Deck Statistics */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Estatísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Overview Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{deckStats.totalCards}</p>
                          <p className="text-xs text-gray-400">Mainboard</p>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-400">{deckStats.sideboardCards}</p>
                          <p className="text-xs text-gray-400">Sideboard</p>
                        </div>
                      </div>

                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-yellow-400">R$ {deckStats.totalValue.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">Valor Estimado</p>
                      </div>

                      {/* Mana Curve */}
                      <div>
                        <h3 className="text-white font-semibold mb-3">Curva de Mana</h3>
                        <div className="space-y-2">
                          {Object.entries(deckStats.manaCurve)
                            .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
                            .slice(0, 10)
                            .map(([cmc, count]) => (
                              <div key={cmc} className="flex items-center gap-3">
                                <span className="text-gray-300 text-sm w-6 text-center font-mono">{cmc}</span>
                                <div className="flex-1 bg-gray-700 rounded-full h-4 relative">
                                  <div
                                    className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 flex items-center justify-end pr-2"
                                    style={{
                                      width: `${Math.max(10, (count / Math.max(...Object.values(deckStats.manaCurve))) * 100)}%`,
                                    }}
                                  >
                                    {count > 0 && <span className="text-white text-xs font-bold">{count}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Color Distribution */}
                      <div>
                        <h3 className="text-white font-semibold mb-3">Distribuição de Cores</h3>
                        <div className="space-y-2">
                          {Object.entries(deckStats.colorDistribution)
                            .filter(([, count]) => count > 0)
                            .sort(([, a], [, b]) => b - a)
                            .map(([color, count]) => (
                              <div key={color} className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full border"
                                  style={{ backgroundColor: colorMap[color as keyof typeof colorMap] }}
                                />
                                <span className="text-gray-300 text-sm flex-1">
                                  {color === "C" ? "Incolor" : color}
                                </span>
                                <span className="text-white text-sm font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Type Distribution */}
                      <div>
                        <h3 className="text-white font-semibold mb-3">Tipos de Carta</h3>
                        <div className="space-y-2">
                          {Object.entries(deckStats.typeDistribution)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 6)
                            .map(([type, count]) => (
                              <div key={type} className="flex items-center justify-between">
                                <span className="text-gray-300 text-sm">{type}</span>
                                <span className="text-white text-sm font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card Search */}
                  <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg">Buscar Cartas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Nome da carta..."
                        value={deckSearchQuery}
                        onChange={(e) => setDeckSearchQuery(e.target.value)}
                        className={inputClasses}
                      />

                      {/* Quick Filters */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1 block">RARIDADE</label>
                          <Select value={rarityFilter} onValueChange={setRarityFilter}>
                            <SelectTrigger className={`${selectClasses} text-sm h-8`}>
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

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-gray-400 mb-1 block">CMC</label>
                            <Input
                              placeholder="0-15"
                              value={cmcFilter}
                              onChange={(e) => setCmcFilter(e.target.value)}
                              className={`${inputClasses} text-sm h-8`}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-400 mb-1 block">PODER</label>
                            <Input
                              placeholder="0-20"
                              value={powerFilter}
                              onChange={(e) => setPowerFilter(e.target.value)}
                              className={`${inputClasses} text-sm h-8`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-2 block">CORES</label>
                          <div className="flex gap-1 flex-wrap">
                            {[
                              { color: "W", name: "W", bg: "#fffbd5" },
                              { color: "U", name: "U", bg: "#0e68ab" },
                              { color: "B", name: "B", bg: "#150b00" },
                              { color: "R", name: "R", bg: "#d3202a" },
                              { color: "G", name: "G", bg: "#00733e" },
                              { color: "C", name: "C", bg: "#ccc2c0" },
                            ].map(({ color, name, bg }) => (
                              <Button
                                key={color}
                                variant={activeColors.has(color) ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleColor(color)}
                                className={`w-8 h-8 p-0 border-2 ${
                                  activeColors.has(color) ? "border-white shadow-lg" : "border-gray-600 opacity-50"
                                }`}
                                style={{ backgroundColor: bg, color: color === "W" || color === "C" ? "#000" : "#fff" }}
                              >
                                {name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {isSearchingCards && (
                        <div className="text-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">Carregando cartas...</p>
                        </div>
                      )}

                      {/* Search Results */}
                      {!isSearchingCards && deckBuilderCards.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {visibleDeckCards.slice(0, 20).map((card) => (
                            <div
                              key={card.id}
                              className="flex items-center gap-3 p-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
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
                                <p className="text-gray-400 text-xs truncate">{card.type_line.split("—")[0].trim()}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => addCardToDeck(card, 1, false)}
                                  className="w-8 h-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                  title="Adicionar ao Mainboard"
                                >
                                  M
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => addCardToDeck(card, 1, true)}
                                  className="w-8 h-6 p-0 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  title="Adicionar ao Sideboard"
                                >
                                  S
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isSearchingCards && deckBuilderCards.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-400 mb-4 text-sm">Carregando base de cartas...</p>
                          <Button
                            onClick={fetchDeckBuilderCards}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Carregar Cartas
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Card Detail Modal */}
          {selectedCard && (
            <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
              <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="text-white">{selectedCard.name}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={getOptimizedImageUrl(selectedCard) || "/placeholder.svg"}
                      alt={selectedCard.name}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-semibold mb-2">Informações da Carta</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <strong>Custo de Mana:</strong>{" "}
                          <span dangerouslySetInnerHTML={{ __html: formatManaSymbols(selectedCard.mana_cost || "") }} />
                        </p>
                        <p className="text-gray-300">
                          <strong>CMC:</strong> {selectedCard.cmc}
                        </p>
                        <p className="text-gray-300">
                          <strong>Tipo:</strong> {selectedCard.type_line}
                        </p>
                        <p className="text-gray-300">
                          <strong>Raridade:</strong>{" "}
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
                            {selectedCard.rarity}
                          </Badge>
                        </p>
                        {selectedCard.power && selectedCard.toughness && (
                          <p className="text-gray-300">
                            <strong>P/T:</strong> {selectedCard.power}/{selectedCard.toughness}
                          </p>
                        )}
                        <p className="text-gray-300">
                          <strong>Edição:</strong> {selectedCard.set_name} (
                          {selectedCard.set_code?.toUpperCase() || "N/A"})
                        </p>
                        <p className="text-gray-300">
                          <strong>Artista:</strong> {selectedCard.artist}
                        </p>
                        <p className="text-gray-300">
                          <strong>Idioma:</strong> {selectedCard.lang?.toUpperCase() || "N/A"}
                        </p>
                        <p className="text-gray-300">
                          <strong>Valor Estimado:</strong> R$ {getEstimatedPrice(selectedCard).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {selectedCard.oracle_text && (
                      <div>
                        <h3 className="text-white font-semibold mb-2">Texto do Oráculo</h3>
                        <div
                          className="text-gray-300 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: formatManaSymbols(selectedCard.oracle_text.replace(/\n/g, "<br>")),
                          }}
                        />
                      </div>
                    )}

                    {ownedCardsMap.has(selectedCard.id) && (
                      <div>
                        <h3 className="text-white font-semibold mb-2">Informações da Coleção</h3>
                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-medium">Carta Possuída</span>
                          </div>
                          {(() => {
                            const ownedCard = ownedCardsMap.get(selectedCard.id)!
                            const quantity = Number.parseInt(ownedCard.originalEntry.Quantity || "1", 10)
                            return (
                              <div className="text-sm text-gray-300">
                                <p>
                                  <strong>Quantidade:</strong> {quantity}x
                                </p>
                                {Object.entries(ownedCard.originalEntry)
                                  .filter(([key, value]) => value && key !== "Quantity")
                                  .slice(0, 5)
                                  .map(([key, value]) => (
                                    <p key={key}>
                                      <strong>{key}:</strong> {value}
                                    </p>
                                  ))}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Deck Builder Actions */}
                    {activeTab === "deckbuilder" && (
                      <div>
                        <h3 className="text-white font-semibold mb-2">Adicionar ao Deck</h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => addCardToDeck(selectedCard, 1, false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Mainboard
                          </Button>
                          <Button
                            onClick={() => addCardToDeck(selectedCard, 1, true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Sideboard
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}

export default MTGCollectionManager
