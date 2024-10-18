'use client'
import {Card, CardContent, CardHeader, CardFooter} from "@/components/ui/card";
import {CrossPlatformStorage} from "@/lib/storage/cross-platform-storage";
import {useState, useEffect} from "react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {useConfigStore} from "@/lib/state";

interface server {
    url: string
    username: string
    password: string
    id: string
    salt: string
    hash: string
    type: 'navidrome'
}


export default function Home() {

    const [servers, setServers] = useState<any[]>([]);
    const [activeServer, setActiveServer] = useState<server | null>(null);

    const storage = new CrossPlatformStorage();
    useEffect(() => {
        getServers();
        console.log(activeServer)
    } ,[]);

    async function getServers() {
        const servers = await storage.getItem('servers');
        if (!servers) {
            return null;
        }
        setServers(JSON.parse(servers));
        console.log(JSON.parse(servers))
    }

    useEffect (() => {
        getActiveServer();
    } , [])

    const getActiveServer = async () => {
        const server = await storage.getItem('activeServer');
        if (!server) {
            return null;
        }
        setActiveServer(JSON.parse(server));
    }

    const handleDelete = async (id: string) => {
        const newServers = servers.filter(server => server.id !== id);
        await storage.setItem('servers', JSON.stringify(newServers));
        setServers(newServers);
        await storage.setItem('activeServer', JSON.stringify(newServers[0]));
        setActiveServer(newServers[0]);
    }

    const setNewServer = async (server: server) => {
        await storage.setItem('activeServer', JSON.stringify(server));
        setActiveServer(server);
    }
    return (
        <div className="w-full h-screen flex justify-center items-center">
            <Card>
                <CardHeader>
                    Servers
                </CardHeader>
                <CardContent className="space-y-6">
                    {servers.map((server) => {
                        return (
                            <div key={server.id} className={`w-full  flex justify-center rounded-md p-2 ${activeServer && server.id && server.id == activeServer.id ? "bg-green-600": 'bg-gray-700' } space-x-4 flex items-center `}>
                                <p>{server.url}</p>

                                {activeServer && server.id && server.id == activeServer.id ? <p>Active</p> : <Button onClick={() => setNewServer(server)}>Set Active</Button>}
                                <Button onClick={() => handleDelete(server.id)}>Delete</Button>
                            </div>
                        )
                    })}
                </CardContent>
                <CardFooter>
                    <Button asChild>
                        <Link href="/login">Add Server</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}