import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "María García",
    role: "Madre de estudiante",
    avatar: "MG",
    rating: 5,
    text: "Mi hijo pasó de reprobar matemáticas a sacar 95 en el ICFES. Nova Schola transformó completamente su forma de aprender.",
    language: "es",
  },
  {
    name: "James Wilson",
    role: "IB Student",
    avatar: "JW",
    rating: 5,
    text: "The AI tutor explains complex calculus concepts better than any textbook. I went from struggling to getting a 7 in IB Math HL.",
    language: "en",
  },
  {
    name: "Carlos Mendoza",
    role: "Estudiante de bachillerato",
    avatar: "CM",
    rating: 5,
    text: "Las tutorías 24/7 me salvaron antes de mis exámenes. Es como tener un profesor particular siempre disponible.",
    language: "es",
  },
  {
    name: "Sarah Chen",
    role: "AP Physics Student",
    avatar: "SC",
    rating: 5,
    text: "I scored a 5 on AP Physics thanks to Nova Schola. The personalized learning path identified exactly where I needed help.",
    language: "en",
  },
  {
    name: "Ana Rodríguez",
    role: "Profesora de ciencias",
    avatar: "AR",
    rating: 5,
    text: "Recomiendo Nova Schola a todos mis estudiantes. La metodología socrática realmente desarrolla el pensamiento crítico.",
    language: "es",
  },
  {
    name: "Michael Thompson",
    role: "Parent",
    avatar: "MT",
    rating: 5,
    text: "Worth every penny. My daughter's confidence in STEM subjects has skyrocketed. The progress reports keep me informed.",
    language: "en",
  },
];

const SocialProof = () => {
  return (
    <section className="py-24 relative" id="reviews">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.03),transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Testimonios / Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Lo que dicen nuestros{" "}
            <span className="text-gradient">estudiantes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from students and parents around the world.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div 
                key={index} 
                className="glass rounded-2xl p-6 relative group hover:border-primary/30 transition-all duration-300"
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
                
                {/* Language Badge */}
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-4 ${
                  review.language === 'en' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {review.language === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}
                </span>
                
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                
                {/* Review Text */}
                <p className="text-foreground/90 mb-6 leading-relaxed">
                  "{review.text}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{review.name}</p>
                    <p className="text-sm text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Program Highlights */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8">
            <h3 className="text-xl font-bold text-center mb-6 text-gradient">
              Programas que Dominamos / Programs We Master
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
              { name: "ICFES Saber 11", desc: "Colombia", color: "bg-yellow-500/20 text-yellow-400" },
                { name: "IB Diploma", desc: "International", color: "bg-blue-500/20 text-blue-400" },
                { name: "Pensamiento Crítico", desc: "Resolución de Problemas", color: "bg-purple-500/20 text-purple-400" },
                { name: "STEM Focus", desc: "Math & Science", color: "bg-green-500/20 text-green-400" },
              ].map((program) => (
                <div key={program.name} className="text-center p-4 rounded-xl bg-background/50 hover:bg-background/80 transition-colors">
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${program.color}`}>
                    {program.desc}
                  </span>
                  <p className="font-semibold text-foreground">{program.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
