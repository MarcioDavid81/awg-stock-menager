"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, LogIn } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { LoginFormData, loginSchema } from "@/types/frontend";
import logo from "../../../../public/dr agenda.png";
import Image from "next/image";
import Link from "next/link";


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();


  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await apiService.login(data.email, data.password);

      if (response.success) {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      } else {
        toast.error("Email ou senha incorretos.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Email ou senha incorretos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <video
          autoPlay
          muted
          loop
          className="absolute top-0 object-cover z-0 w-full h-full"
          poster="https://res.cloudinary.com/dgdvt1tgv/image/upload/v1757384473/heroawg_ktytox.png"
        >
          <source
            src="https://res.cloudinary.com/dgdvt1tgv/video/upload/v1757384237/13905670_1920_1080_60fps_p4o4fa.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 via-green-800/70 to-green-700/60" />
      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="flex flex-col items-center justify-center">
          <Image src={logo} alt="logo" width={200} height={150} />
          <p className="text-gray-300">Sistema de Gestão de Estoque Agrícola</p>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Entrar
            </CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !form.formState.isValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <a
                  href="#"
                  className="font-medium text-primary hover:underline"
                >
                  Entre em contato com o administrador
                </a>
              </p>
              <span className="text-gray-300">ou</span>
            </div>
              <Link href="/register" className="text-primary text-sm font-medium flex items-center justify-center hover:underline">
                Voltar à Home
              </Link>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-300">
          {`© ${new Date().getFullYear()} AWG StockManager. Todos os direitos reservados.`}
        </div>
      </div>
    </div>
  );
}
