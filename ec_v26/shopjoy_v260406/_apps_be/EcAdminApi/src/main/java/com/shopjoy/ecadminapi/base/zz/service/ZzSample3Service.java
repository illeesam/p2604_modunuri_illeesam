package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSample3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample3;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample1Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample2Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzSample3Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample3Service {

    private final ZzSample1Repository zzSample1Repository;
    private final ZzSample2Repository zzSample2Repository;
    private final ZzSample3Repository zzSample3Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 (상위 sample1 / sample2 단건 포함) */
    public ZzSample3Dto.Item getById(String id) {
        ZzSample3Dto.Item dto = zzSample3Repository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));

        // 상위 sample1 단건 (sample1_id FK)
        if (StringUtils.hasText(dto.getSample1Id()))
            dto.setSample1(zzSample1Repository.selectById(dto.getSample1Id()).orElse(null));
        // 상위 sample2 단건 (sample2_id FK)
        if (StringUtils.hasText(dto.getSample2Id()))
            dto.setSample2(zzSample2Repository.selectById(dto.getSample2Id()).orElse(null));

        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample3Dto.Item getByIdOrNull(String id) {
        return zzSample3Repository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzSample3 findById(String id) {
        return zzSample3Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample3 findByIdOrNull(String id) {
        return zzSample3Repository.findById(id).orElse(null);
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample3Repository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!zzSample3Repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 조회 */
    public List<ZzSample3Dto.Item> getList(ZzSample3Dto.Request req) {
        return zzSample3Repository.selectList(req);
    }

    /** getPageData — 조회 */
    public ZzSample3Dto.PageResponse getPageData(ZzSample3Dto.Request req) {
        PageHelper.addPaging(req);
        return zzSample3Repository.selectPageList(req);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample3 create(ZzSample3 body) {
        body.setSample3Id(CmUtil.generateId("zz_sample3"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzSample3 saved = zzSample3Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample3 save(ZzSample3 entity) {
        if (entity.getSample3Id() == null || !zzSample3Repository.existsById(entity.getSample3Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample3Id() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzSample3Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample3 update(String id, ZzSample3 body) {
        ZzSample3 entity = zzSample3Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "sample3Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzSample3 saved = zzSample3Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample3 entity) {
        return zzSample3Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample3 entity = zzSample3Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        zzSample3Repository.delete(entity);
        em.flush();
        if (zzSample3Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample3> rows) {
        zzSample3Repository.saveAll(rows);
    }
}
