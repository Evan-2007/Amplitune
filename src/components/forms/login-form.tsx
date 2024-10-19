'use client';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SubmitButton } from '@/components/ui/submit-button';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import md5 from 'md5';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Login() {
  const [servers, setServers] = useState<any[]>([]);

  const storage = new CrossPlatformStorage();
  useEffect(() => {
    getServers();
  }, []);

  async function getServers() {
    const servers = await storage.getItem('servers');
    if (!servers) {
      return null;
    }
    setServers(JSON.parse(servers));
  }

  const router = useRouter();
  //check if user is logged in
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {}

  return (
    <Card className='w-[350px]'>
      <CardHeader className='flex flex-row items-center justify-between align-middle'>
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
  url: z.string().url(),
  stayLoggedIn: z.boolean(),
});

function LoginForm() {
  const [loginError, setLoginError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [stayLoggedIn, setStayLoggedIn] = useState<boolean>(false);

  const router = useRouter();

  const localStorage = new CrossPlatformStorage();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      url: '',
      stayLoggedIn: false,
    },
  });
  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      console.log(data);
      setLoading(true);
      const salt = window.crypto.getRandomValues(new Uint32Array(1))[0];
      const hash = md5(data.password + salt);
      const checkAuth = await fetch(`${data.url}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });
      const response = await checkAuth.json();
      if (response.token) {
        const serers = await localStorage.getItem('servers');
        if (serers) {
          const servers = JSON.parse(serers);
          servers.push({
            url: data.url,
            username: data.username,
            password: stayLoggedIn ? data.password : undefined,
            type: 'navidrome',
            salt: response.subsonicSalt,
            hash: response.subsonicToken,
            id: crypto.randomUUID(),
          });
          localStorage.setItem('servers', JSON.stringify(servers));
        } else {
          localStorage.setItem(
            'servers',
            JSON.stringify([
              {
                url: data.url,
                username: data.username,
                password: stayLoggedIn ? data.password : undefined,
                type: 'navidrome',
                salt: response.subsonicSalt,
                hash: response.subsonicToken,
                id: crypto.randomUUID(),
              },
            ])
          );
        }
        console.log(localStorage);
        await localStorage.setItem(
          'activeServer',
          JSON.stringify({
            url: data.url,
            username: data.username,
            password: stayLoggedIn ? data.password : undefined,
            type: 'navidrome',
            salt: response.subsonicSalt,
            hash: response.subsonicToken,
            id: crypto.randomUUID(),
          })
        );
        router.push('/');
      } else if (response.error?.message === 'Invalid username or password') {
        setLoginError('Invalid username or password');
        setError(true);
      } else {
        setError(true);
        setLoginError('An error occurred');
        throw new Error('An error occurred');
      }
    } catch (error) {
      setLoginError('Faild to communicate with server');
      setError(true);
      console.error('An error occurred:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col justify-center space-y-4'
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => <FormInput field={field} name='Username' />}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormInput field={field} name='Password' type='password' />
          )}
        />
        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormInput field={field} name='Url (include http://)' />
          )}
        />
        <FormField
          control={form.control}
          name='stayLoggedIn'
          render={({ field }) => (
            <FormCheckbox field={field} name='Stay Logged In' />
          )}
        />
        <div>
          <SubmitButton
            type='submit'
            className='mt-4'
            error={error}
            loading={loading}
            errorMessage={loginError}
          >
            Login
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}

function FormInput({
  field,
  name,
  type = 'text',
}: {
  field: any;
  name: string;
  type?: 'text' | 'password';
}) {
  return (
    <FormItem>
      <FormLabel>{name}</FormLabel>
      <FormControl>
        <Input type={type} placeholder={name} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}

function FormCheckbox({ field, name }: { field: any; name: string }) {
  return (
    <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={(checked) => {
            return checked ? field.onChange(true) : field.onChange(false);
          }}
        />
      </FormControl>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <FormLabel className='text-center text-sm font-normal'>
              {name}
            </FormLabel>
          </TooltipTrigger>
          <TooltipContent>
            <FormDescription>Saves username/password to device</FormDescription>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <FormMessage />
    </FormItem>
  );
}
