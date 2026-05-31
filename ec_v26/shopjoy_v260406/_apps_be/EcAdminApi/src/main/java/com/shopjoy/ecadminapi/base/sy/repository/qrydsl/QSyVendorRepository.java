package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyVendor QueryDSL Custom Repository */
public interface QSyVendorRepository {

    Optional<SyVendorDto.Item> selectById(String vendorId);

    List<SyVendorDto.Item> selectList(SyVendorDto.Request search);

    SyVendorDto.PageResponse selectPageData(SyVendorDto.Request search);

    int updateSelective(SyVendor entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeVendorCnts(SyVendorDto.Request search);
}
