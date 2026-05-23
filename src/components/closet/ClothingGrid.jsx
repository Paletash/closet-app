import ClothingCard from './ClothingCard'

export default function ClothingGrid({ clothes }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
      {clothes.map((item) => (
        <ClothingCard key={item.id} item={item} />
      ))}
    </div>
  )
}
