import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
export default function Testimonial() {
  return (
    <>
      <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 flex items-center justify-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-sky-100 px-3 py-1 text-sm text-sky-700">Testimonials</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Trusted by Car Wash Owners</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                See what our customers have to say about how SplashManager has transformed their business.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
            {[
              {
                quote:
                  "Since implementing SplashManager, we've increased our daily appointments by 35% and reduced no-shows by over 50%. The automated reminders are a game-changer.",
                author: "Michael Rodriguez",
                position: "Owner, Sunshine Car Wash",
              },
              {
                quote:
                  "The inventory management feature alone has saved us thousands of dollars by preventing overordering and ensuring we never run out of essential supplies.",
                author: "Sarah Johnson",
                position: "Manager, Elite Auto Spa",
              },
              {
                quote:
                  "As someone who owns multiple locations, the ability to manage everything from one dashboard has simplified our operations tremendously.",
                author: "David Chen",
                position: "CEO, FastTrack Car Wash Chain",
              },
              {
                quote:
                  "The customer loyalty program integration helped us build a regular client base. Our repeat business is up 40% in just three months.",
                author: "Jennifer Williams",
                position: "Owner, Crystal Clear Car Wash",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="text-left">
                <CardContent className="pt-6">
                  <p className="mb-4 italic text-muted-foreground">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.position}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}