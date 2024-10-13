'use client'
import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
} from '@/components/ui/card';
import { ModeToggle } from '@/components/theme-toggle';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { SubmitButton } from '@/components/ui/submit-button';
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import md5 from 'md5';


export function Login() {
  
  const router = useRouter();
    //check if user is logged in
    useEffect (() => {
      checkAuth();
    } , [])

    async function checkAuth() {
    }

    return ( 
        <Card className='w-[350px]'>
        <CardHeader className='flex flex-row align-middle items-center justify-between'>
          <h1 className='text-2xl'>Login</h1>
          <ModeToggle />
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    );
}

const schema = z.object({
    username: z.string(),
    password: z.string(),
    url: z.string().url()
})

function LoginForm() {

  const [loginError, setLoginError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof schema>>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        username: "",
        password: "",
        url: ""
      }
    }
  )
  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      const salt = window.crypto.getRandomValues(new Uint32Array(1))[0]
      const hash = md5(data.password + salt);
      const checkAuth = await fetch(`${data.url}/rest/ping.view?u=${data.username}&t=${hash}&s=${salt}&f=json&v=1.13.0&c=myapp`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }); 
      const response = await checkAuth.json();
      if (response['subsonic-response'].status === 'ok') {
        const serers = await localStorage.getItem('servers'); 
        if (serers) {
          localStorage.setItem('password', hash.toString());
          localStorage.setItem('salt', salt.toString());
          localStorage.setItem('username', data.username);
          const servers = JSON.parse(serers);
          servers.push({
            url: data.url,
            username: data.username,
            password: data.password,
            type: 'navidrome',
            salt: salt
          });
          localStorage.setItem('servers', JSON.stringify(servers));
        } else {
          localStorage.setItem('servers', JSON.stringify([{
            url: data.url,
            username: data.username,
            password: data.password,
            type: 'navidrome',
            salt: salt
          }]));
        }
        console.log(localStorage)
        router.push('/');
      } else if (response['subsonic-response'].status === 'failed') {
        setLoginError('Invalid username or password');
        setError(true);
      } else {
        throw new Error('An error occurred');
      }
    } catch (error) {
      setLoginError('Faild to communicate with server');
      setError(true);
      console.error('An error occurred:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Form {...form} >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex justify-center flex-col">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => <FormInput field={field} name="Username" />}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => <FormInput field={field} name="Password" type="password" />}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => <FormInput field={field} name="Url (include http://)" />}
        />
        <div>
          <SubmitButton type='submit' className="mt-4" error={error} loading={loading} errorMessage={loginError}>Login</SubmitButton>
        </div>
      </form>
    </Form>
  )
}


function FormInput({ field, name, type = 'text' }: { field: any, name: string, type?: 'text' | 'password' }) {
  return (
      <FormItem>
          <FormLabel>{name}</FormLabel>
          <FormControl>
              <Input type={type} placeholder={name} {...field} />
          </FormControl>
          <FormMessage />
      </FormItem>
  )
}