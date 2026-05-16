package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample0Repository;
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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample0Service {

    private final ZzSample0Repository zzSample0Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 */
    public ZzSample0Dto.Item getById(String id) {
        ZzSample0Dto.Item dto = zzSample0Repository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample0Dto.Item getByIdOrNull(String id) {
        return zzSample0Repository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzSample0 findById(String id) {
        return zzSample0Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample0 findByIdOrNull(String id) {
        return zzSample0Repository.findById(id).orElse(null);
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample0Repository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!zzSample0Repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 조회 */
    public List<ZzSample0Dto.Item> getList(ZzSample0Dto.Request req) {
        return zzSample0Repository.selectList(req);
    }

    /** getPageData — 조회 */
    public ZzSample0Dto.PageResponse getPageData(ZzSample0Dto.Request req) {
        PageHelper.addPaging(req);
        return zzSample0Repository.selectPageList(req);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample0 create(ZzSample0 body) {
        body.setSample0Id(CmUtil.generateId("zz_sample0"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzSample0 saved = zzSample0Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample0 save(ZzSample0 entity) {
        if (entity.getSample0Id() == null || !zzSample0Repository.existsById(entity.getSample0Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample0Id() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        return zzSample0Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample0 update(String id, ZzSample0 body) {
        ZzSample0 entity = zzSample0Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "sample0Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzSample0 saved = zzSample0Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample0 entity) {
        return zzSample0Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample0 entity = zzSample0Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        zzSample0Repository.delete(entity);
        em.flush();
        if (zzSample0Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample0> rows) {
        zzSample0Repository.saveAll(rows);
    }
}
