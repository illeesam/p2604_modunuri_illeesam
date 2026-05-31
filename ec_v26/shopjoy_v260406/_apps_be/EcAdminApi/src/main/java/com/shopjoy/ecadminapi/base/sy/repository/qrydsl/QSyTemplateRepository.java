package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** SyTemplate QueryDSL Custom Repository */
public interface QSyTemplateRepository {
    Optional<SyTemplateDto.Item> selectById(String templateId);
    List<SyTemplateDto.Item> selectList(SyTemplateDto.Request search);
    SyTemplateDto.PageResponse selectPageList(SyTemplateDto.Request search);
    int updateSelective(SyTemplate entity);
    /** 표시경로 노드별 수 집계 (자손 누적 + 검색조건 필터, native CTE 동적 SQL).
     *   반환: [{pathId, cnt}, ...] — '__total__' / '__orphan__' 특수 path 행 포함. */
    List<Map<String, Object>> selectPathTreeTemplateCnts(SyTemplateDto.Request search);
}
