'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card';  
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CrossPlatformStorage } from '@/lib/storage/cross-platform-storage'
import { useEffect, useState } from 'react';

interface Server {
    url: string;
    username: string;
    password: string;
    type: 'navidrome';
    salt: string;
}

export default function servers() {
    const [servers, setServers] = useState<Server[]>([]);

    useEffect(() => {
        getServers();
    }, []);

    async function getServers() {
        const storage = new CrossPlatformStorage();
        const servers = await storage.getItem('servers');
    //const servers = [{"url":"https://music.evanc.dev","username":"evan","password":"EvanC2007","type":"navidrome","salt":2538323885}]
            console.log(servers);

        const formatedServers = servers.map((server: Server) => {
            return {
                url: server.url,
                username: server.username,
                password: server.password,
                type: server.type,
                salt: server.salt
            }
        });
        if (servers) {
            setServers(formatedServers);
            console.log(servers);
        }
    }


    return (
        <div className='w-screen h-screen flex justify-center items-center'>
        <Card>
            <CardHeader title='Servers' />
            <CardContent>
                <p>Connect to your Navidrome server</p>
                {servers.map((server, index) => (
                    <Link href={`/servers/${index}`} key={index}>
                        <Button>{server.username}</Button>
                    </Link>
                ))}
                <Link href='/home'>
                    <Button>Exit</Button>
                </Link>
                <Link href='/servers/add'>
                    <Button>Add Server</Button>
                </Link>
            </CardContent>

        </Card>
        </div>
    );
}