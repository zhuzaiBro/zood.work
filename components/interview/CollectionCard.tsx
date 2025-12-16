import Image from 'next/image';
import Link from 'next/link';
import { Database } from '@/types/database.types';

type Collection = Database['public']['Tables']['interview_collections']['Row'];

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link 
      href={`/interview/${collection.id}`}
      className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {collection.icon ? (
            collection.icon.startsWith('http') || collection.icon.startsWith('/') ? (
              <Image 
                src={collection.icon} 
                alt={collection.title} 
                width={48} 
                height={48} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">{collection.icon}</span>
            )
          ) : (
            <div className="w-full h-full bg-blue-100" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
            {collection.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            {collection.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

