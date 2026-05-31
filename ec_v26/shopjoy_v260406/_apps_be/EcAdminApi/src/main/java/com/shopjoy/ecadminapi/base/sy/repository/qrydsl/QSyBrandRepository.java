package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyBrand QueryDSL Custom Repository */
public interface QSyBrandRepository {

    Optional<SyBrandDto.Item> selectById(String brandId);

    List<SyBrandDto.Item> selectList(SyBrandDto.Request search);

    SyBrandDto.PageResponse selectPageList(SyBrandDto.Request search);

    int updateSelective(SyBrand entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeBrandCnts(SyBrandDto.Request search);
}
