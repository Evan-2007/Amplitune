'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ModeToggle } from '@/components/theme-toggle';
import {
  Form,
  FormControl,
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeServerUrl, useAccountsStore } from '@/lib/accounts/store';

export function Login() {
  return (
    <Card className='w-[350px]'>
      <CardHeader className='flex flex-row items-center justify-between align-middle'>
        <h1 className='text-2xl'>Add Navidrome server</h1>
        <ModeToggle />
      </CardHeader>
      <CardContent>
        <LoginForm />
        <Link
          href='/accounts'
          className='mt-4 block text-center text-sm text-muted-foreground hover:underline'
        >
          Back to accounts
        </Link>
      </CardContent>
    </Card>
  );
}

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  url: z.string().url('Enter a full URL, including http:// or https://'),
});

function LoginForm() {
  const [loginError, setLoginError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const router = useRouter();

  const saveNavidromeAccount = useAccountsStore(
    (state) => state.saveNavidromeAccount
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      url: '',
    },
  });
  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setLoading(true);
      setError(false);
      const url = normalizeServerUrl(data.url);
      const checkAuth = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });
      if (checkAuth.status === 401) {
        setLoginError('Invalid username or password');
        setError(true);
        return;
      }
      const response = await checkAuth.json().catch(() => null);
      if (response?.token) {
        // The password is never persisted; the Subsonic salt/hash are enough.
        // Logging in again to the same server replaces the old entry.
        saveNavidromeAccount({
          url,
          username: data.username,
          salt: response.subsonicSalt,
          hash: response.subsonicToken,
          token: response.token,
        });
        router.push('/home');
      } else {
        setLoginError('That does not look like a Navidrome server');
        setError(true);
      }
    } catch (error) {
      // fetch rejects for both an unreachable host and a blocked CORS request
      setLoginError('Could not reach the server. Check the URL and CORS.');
      setError(true);
      console.error('Login failed:', error);
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
          name='url'
          render={({ field }) => (
            <FormInput
              field={field}
              name='Server URL'
              placeholder='https://music.example.com'
            />
          )}
        />
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
        <div>
          <SubmitButton
            type='submit'
            className='mt-4'
            error={error}
            loading={loading}
            errorMessage={loginError}
          >
            Connect
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
  placeholder,
}: {
  field: any;
  name: string;
  type?: 'text' | 'password';
  placeholder?: string;
}) {
  return (
    <FormItem>
      <FormLabel>{name}</FormLabel>
      <FormControl>
        <Input type={type} placeholder={placeholder ?? name} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
