import { memo } from 'react'
import ClothingCard from './ClothingCard'

const ClothingGrid = memo(function ClothingGrid({ clothes }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
      {clothes.map((item) => (
        <ClothingCard key={item.id} item={item} />
      ))}
    </div>
  )
})

export default ClothingGrid
