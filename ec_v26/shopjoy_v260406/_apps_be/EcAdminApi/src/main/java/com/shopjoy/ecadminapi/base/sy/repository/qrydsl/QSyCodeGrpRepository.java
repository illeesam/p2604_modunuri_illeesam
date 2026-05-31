package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyCodeGrp QueryDSL Custom Repository */
public interface QSyCodeGrpRepository {

    Optional<SyCodeGrpDto.Item> selectById(String codeGrpId);

    List<SyCodeGrpDto.Item> selectList(SyCodeGrpDto.Request search);

    SyCodeGrpDto.PageResponse selectPageList(SyCodeGrpDto.Request search);

    int updateSelective(SyCodeGrp entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeCodeGrpCnts(SyCodeGrpDto.Request search);
}
