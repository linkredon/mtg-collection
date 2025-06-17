'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, Clock, Star, Heart, Share2 } from 'lucide-react'

interface CardData {
  id: string
  title: string
  description: string
  image: string
  category: string
  date: string
  location: string
  attendees: number
  rating: number
  price: string
  fullDescription: string
  features: string[]
  organizer: {
    name: string
    avatar: string
    bio: string
  }
}

const cardData: CardData[] = [
  {
    id: '1',
    title: 'Workshop de Design Thinking',
    description: 'Aprenda metodologias inovadoras para resolver problemas complexos',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Workshop',
    date: '2024-02-15',
    location: 'São Paulo, SP',
    attendees: 45,
    rating: 4.8,
    price: 'R$ 150,00',
    fullDescription: 'Este workshop intensivo de Design Thinking oferece uma imersão completa nas metodologias mais eficazes para inovação e resolução de problemas. Durante 8 horas, você aprenderá técnicas práticas utilizadas pelas maiores empresas do mundo para desenvolver soluções centradas no usuário.',
    features: ['Material didático incluso', 'Certificado de participação', 'Coffee break', 'Networking'],
    organizer: {
      name: 'Ana Silva',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
      bio: 'Designer com 10 anos de experiência em inovação e metodologias ágeis.'
    }
  },
  {
    id: '2',
    title: 'Conferência de Tecnologia 2024',
    description: 'As últimas tendências em IA, blockchain e desenvolvimento web',
    image: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Conferência',
    date: '2024-03-20',
    location: 'Rio de Janeiro, RJ',
    attendees: 200,
    rating: 4.9,
    price: 'R$ 300,00',
    fullDescription: 'A maior conferência de tecnologia do ano reunindo especialistas internacionais para discutir o futuro da tecnologia. Palestras sobre inteligência artificial, blockchain, desenvolvimento web moderno e muito mais.',
    features: ['Palestras internacionais', 'Área de networking', 'Almoço incluso', 'Swag bag'],
    organizer: {
      name: 'Tech Events Brasil',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
      bio: 'Organizadora de eventos de tecnologia há mais de 15 anos.'
    }
  },
  {
    id: '3',
    title: 'Curso de Fotografia Digital',
    description: 'Do básico ao avançado: domine a arte da fotografia digital',
    image: 'https://images.pexels.com/photos/606541/pexels-photo-606541.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Curso',
    date: '2024-02-28',
    location: 'Belo Horizonte, MG',
    attendees: 25,
    rating: 4.7,
    price: 'R$ 450,00',
    fullDescription: 'Curso completo de fotografia digital com duração de 3 dias. Aprenda técnicas de composição, iluminação, edição e pós-produção. Inclui sessões práticas em estúdio e externa.',
    features: ['Equipamentos fornecidos', 'Sessões práticas', 'Software de edição', 'Portfolio final'],
    organizer: {
      name: 'Carlos Mendes',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
      bio: 'Fotógrafo profissional especializado em retratos e eventos corporativos.'
    }
  },
  {
    id: '4',
    title: 'Meetup de Startups',
    description: 'Networking e pitch de ideias inovadoras',
    image: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Meetup',
    date: '2024-02-10',
    location: 'Florianópolis, SC',
    attendees: 80,
    rating: 4.6,
    price: 'Gratuito',
    fullDescription: 'Encontro mensal da comunidade de startups de Florianópolis. Uma oportunidade única para fazer networking, apresentar sua ideia e conhecer investidores e mentores do ecossistema de inovação.',
    features: ['Networking', 'Pitch session', 'Mentoria gratuita', 'Happy hour'],
    organizer: {
      name: 'Startup SC',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200',
      bio: 'Comunidade que conecta empreendedores e investidores em Santa Catarina.'
    }
  },
  {
    id: '5',
    title: 'Workshop de Culinária Italiana',
    description: 'Aprenda a fazer massas artesanais e molhos tradicionais',
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Culinária',
    date: '2024-02-25',
    location: 'Porto Alegre, RS',
    attendees: 15,
    rating: 4.9,
    price: 'R$ 200,00',
    fullDescription: 'Workshop hands-on de culinária italiana com chef especializado. Aprenda técnicas tradicionais para fazer massas frescas, molhos clássicos e sobremesas típicas. Inclui degustação e receitas para levar para casa.',
    features: ['Ingredientes inclusos', 'Receitas impressas', 'Degustação', 'Avental personalizado'],
    organizer: {
      name: 'Chef Marco Rossi',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200',
      bio: 'Chef italiano com 20 anos de experiência em restaurantes tradicionais.'
    }
  },
  {
    id: '6',
    title: 'Seminário de Marketing Digital',
    description: 'Estratégias avançadas para crescimento online',
    image: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Seminário',
    date: '2024-03-05',
    location: 'Brasília, DF',
    attendees: 120,
    rating: 4.8,
    price: 'R$ 250,00',
    fullDescription: 'Seminário intensivo sobre as mais recentes estratégias de marketing digital. Aborda SEO, marketing de conteúdo, redes sociais, automação de marketing e análise de dados para maximizar o ROI.',
    features: ['Material digital', 'Planilhas de análise', 'Acesso gravação', 'Consultoria pós-evento'],
    organizer: {
      name: 'Digital Marketing Pro',
      avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=200',
      bio: 'Agência especializada em marketing digital e growth hacking.'
    }
  }
]

export default function HomePage() {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCardClick = (card: CardData) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Eventos & Experiências
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubra workshops, cursos e eventos incríveis para expandir seus conhecimentos e fazer networking
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardData.map((card) => (
            <Card 
              key={card.id} 
              className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group overflow-hidden"
              onClick={() => handleCardClick(card)}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={card.image} 
                  alt={card.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {card.category}
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-800">{card.rating}</span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {card.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(card.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{card.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{card.attendees} participantes</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-lg font-bold text-blue-600">{card.price}</span>
                  <Button size="sm" className="group-hover:bg-blue-600 transition-colors">
                    Ver detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedCard && (
              <>
                <DialogHeader>
                  <div className="relative mb-4">
                    <img 
                      src={selectedCard.image} 
                      alt={selectedCard.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {selectedCard.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1 bg-white/90 rounded-full px-3 py-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-800">{selectedCard.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {selectedCard.title}
                  </DialogTitle>
                  <DialogDescription className="text-lg text-gray-600">
                    {selectedCard.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Sobre o evento</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedCard.fullDescription}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">O que está incluído</h3>
                      <ul className="space-y-2">
                        {selectedCard.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Organizador</h3>
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <img 
                          src={selectedCard.organizer.avatar} 
                          alt={selectedCard.organizer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{selectedCard.organizer.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{selectedCard.organizer.bio}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="text-center mb-4">
                        <span className="text-3xl font-bold text-blue-600">{selectedCard.price}</span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span className="text-sm">{formatDate(selectedCard.date)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <span className="text-sm">{selectedCard.location}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-500" />
                          <span className="text-sm">{selectedCard.attendees} participantes</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-gray-500" />
                          <span className="text-sm">8 horas de duração</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          Inscrever-se agora
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Heart className="w-4 h-4 mr-2" />
                            Favoritar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Política de cancelamento</h4>
                      <p className="text-sm text-gray-600">
                        Reembolso total até 7 dias antes do evento. 
                        Após esse período, não há reembolso.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}