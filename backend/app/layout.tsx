import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'DogWalk Maroc · Admin',description:'Gestion des demandes DogWalk Maroc'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"/></head><body>{children}</body></html>}
