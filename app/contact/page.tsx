import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 container max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md jupiter-outer-panel p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-[#afcd4f]">Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              It looks like you're not the authorized wallet for the admin panel. Please use this form to get in touch
              with us.
            </p>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@example.com"
                  className="bg-neumorphic-base shadow-inner-neumorphic text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Your message..."
                  className="min-h-[120px] bg-neumorphic-base shadow-inner-neumorphic text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="jupiter-button-dark w-full h-12 px-6 bg-neumorphic-base hover:bg-neumorphic-base"
              >
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </main>
  )
}
