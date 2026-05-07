package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.mapper.SyContactMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoSyContactService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final SyContactMapper syContactMapper;
    private final SyContactRepository syContactRepository;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<SyContactDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syContactMapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<SyContactDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syContactMapper.selectPageList(p), syContactMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public SyContactDto getById(String id) {
        SyContactDto dto = syContactMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public SyContact create(SyContact body) {
        body.setContactId("CO" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public SyContactDto update(String id, SyContact body) {
        SyContact entity = syContactRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "contactId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyContact saved = syContactRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        SyContact entity = syContactRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        syContactRepository.delete(entity);
        em.flush();
        if (syContactRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<SyContact> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getContactId() != null)
            .map(SyContact::getContactId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syContactRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        List<SyContact> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getContactId() != null)
            .toList();
        for (SyContact row : updateRows) {
            SyContact entity = syContactRepository.findById(row.getContactId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + row.getContactId()));
            VoUtil.voCopyExclude(row, entity, "contactId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syContactRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        List<SyContact> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyContact row : insertRows) {
            row.setContactId("CO" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syContactRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}